/**
 * Spec e2e — SPO-171 Bajarse de un partido (DELETE /partidos/:id/participantes/me).
 *
 * Cada `it()` arranca con el identificador del AC que cubre.
 */
import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import {
  closeTestApp,
  createTestApp,
  resetDatabase,
  setAuthUser,
  type TestContext,
} from './setup-e2e';
import { OTHER_USER, partidoPayload, seedBaseline } from './fixtures';
import { AppModule } from '../src/app.module';
import { PartidosController } from '../src/partidos/partidos.controller';
import { FirebaseAuthGuard } from '../src/auth/firebase-auth.guard';
import { FIREBASE_ADMIN } from '../src/firebase/firebase.module';

describe('Partidos — leave (SPO-171)', () => {
  let ctx: TestContext;
  let server: Server;
  let deporteId: string;
  let organizadorId: string;
  let otroId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    server = ctx.app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    ({ deporteId, organizadorId, otroId } = await seedBaseline(ctx.prisma));
  });

  async function crearPartido(overrides: Record<string, unknown> = {}) {
    const res = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, overrides))
      .expect(201);
    return res.body;
  }

  async function crearPartidoConOtroAnotado() {
    const partido = await crearPartido();
    setAuthUser(OTHER_USER);
    await request(server)
      .post(`/partidos/${partido.id}/participantes`)
      .expect(201);
    return partido;
  }

  it('[AC-1] bajarse de un partido en el que estoy anotado devuelve 204 y borra la fila', async () => {
    const partido = await crearPartidoConOtroAnotado();

    const response = await request(server)
      .delete(`/partidos/${partido.id}/participantes/me`)
      .expect(204);

    expect(response.body).toEqual({});

    const fila = await ctx.prisma.participante.findFirst({
      where: { partidoId: partido.id, usuarioId: otroId },
    });
    expect(fila).toBeNull();
  });

  it('[AC-2] anotados baja en uno y estoy_anotado pasa a false en la siguiente lectura', async () => {
    const partido = await crearPartidoConOtroAnotado();

    const antes = await request(server)
      .get(`/partidos/${partido.id}`)
      .expect(200);
    expect(antes.body).toMatchObject({ anotados: 1, estoy_anotado: true });

    await request(server)
      .delete(`/partidos/${partido.id}/participantes/me`)
      .expect(204);

    const despues = await request(server)
      .get(`/partidos/${partido.id}`)
      .expect(200);
    expect(despues.body).toMatchObject({ anotados: 0, estoy_anotado: false });
  });

  it('[AC-3] bajarse dos veces seguidas: la segunda devuelve 404, no 500', async () => {
    const partido = await crearPartidoConOtroAnotado();

    await request(server)
      .delete(`/partidos/${partido.id}/participantes/me`)
      .expect(204);

    await request(server)
      .delete(`/partidos/${partido.id}/participantes/me`)
      .expect(404);
  });

  it('[AC-4] partido inexistente devuelve 404', async () => {
    await request(server)
      .delete('/partidos/no-existe/participantes/me')
      .expect(404);
  });

  it('[AC-4] partido ya jugado devuelve 400', async () => {
    const partido = await ctx.prisma.partido.create({
      data: {
        deporteId,
        organizadorId,
        nivel: 'INTERMEDIO',
        fecha: new Date('2020-01-01T18:00:00.000Z'),
        ubicacion: 'Cancha vieja',
        cupo: 10,
        participantes: {
          create: { usuarioId: otroId },
        },
      },
    });

    setAuthUser(OTHER_USER);
    await request(server)
      .delete(`/partidos/${partido.id}/participantes/me`)
      .expect(400);
  });

  it('[AC-4] sin token devuelve 401 — el endpoint está bajo FirebaseAuthGuard', async () => {
    // El controller declara @UseGuards(FirebaseAuthGuard). Lo verificamos
    // leyendo los guards de Nest sobre la clase del controller.
    const guards: unknown[] =
      Reflect.getMetadata('__guards__', PartidosController) ?? [];
    expect(guards).toContain(FirebaseAuthGuard);

    // Y un request sin `request.user` (sin auth) debe ser rechazado por el
    // guard real. Para no romper el `ctx` del spec (que usa el guard
    // mockeado), creamos un mini app efímero sólo para este caso.
    await closeTestApp(ctx);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FIREBASE_ADMIN)
      .useValue({})
      .compile();

    const appSinGuard = moduleRef.createNestApplication();
    appSinGuard.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await appSinGuard.init();
    const serverSinGuard = appSinGuard.getHttpServer();

    const res = await request(serverSinGuard).delete(
      '/partidos/cualquier-id/participantes/me',
    );
    expect(res.status).toBe(401);

    await appSinGuard.close();

    // Restauramos la app principal para los siguientes tests.
    ctx = await createTestApp();
    server = ctx.app.getHttpServer() as Server;
  });

  it('[AC-5] el lugar liberado se puede volver a ocupar', async () => {
    // Cupo 2 y dos participantes: el organizador NO cuenta como anotado
    // (no se anota a su propio partido), así que cupo=2 admite exactamente
    // dos participantes de la tabla `participantes`.
    const partido = await crearPartido({ cupo: 2 });

    // Crea un tercer usuario antes para tener dos participantes extra.
    await ctx.prisma.user.create({
      data: {
        firebaseUid: 'e2e-uid-tercero',
        email: 'tercero@e2e.test',
        nombre: 'Tercero E2E',
      },
    });

    setAuthUser(OTHER_USER);
    await request(server)
      .post(`/partidos/${partido.id}/participantes`)
      .expect(201);

    setAuthUser({
      uid: 'e2e-uid-tercero',
      email: 'tercero@e2e.test',
      nombre: 'Tercero E2E',
    });
    await request(server)
      .post(`/partidos/${partido.id}/participantes`)
      .expect(201);

    // Ahora el cupo está lleno: un cuarto participante no entra.
    await ctx.prisma.user.create({
      data: {
        firebaseUid: 'e2e-uid-cuarto',
        email: 'cuarto@e2e.test',
        nombre: 'Cuarto E2E',
      },
    });
    setAuthUser({
      uid: 'e2e-uid-cuarto',
      email: 'cuarto@e2e.test',
      nombre: 'Cuarto E2E',
    });
    await request(server)
      .post(`/partidos/${partido.id}/participantes`)
      .expect(409);

    // OTHER_USER se baja y libera el lugar.
    setAuthUser(OTHER_USER);
    await request(server)
      .delete(`/partidos/${partido.id}/participantes/me`)
      .expect(204);

    // Tras la baja, el cuarto puede anotarse en el lugar liberado.
    setAuthUser({
      uid: 'e2e-uid-cuarto',
      email: 'cuarto@e2e.test',
      nombre: 'Cuarto E2E',
    });
    await request(server)
      .post(`/partidos/${partido.id}/participantes`)
      .expect(201);
  });

  it('[AC-6] no existe ninguna ruta que permita bajar a otro usuario', async () => {
    const partido = await crearPartidoConOtroAnotado();

    const rutasProhibidas = [
      `/partidos/${partido.id}/participantes`,
      `/partidos/${partido.id}/participantes/${otroId}`,
      `/partidos/${partido.id}/participantes/${otroId}/me`,
    ];

    for (const ruta of rutasProhibidas) {
      const res = await request(server).delete(ruta);
      expect([404, 405]).toContain(res.status);
    }

    // Y la ruta correcta es SIEMPRE del usuario autenticado: el organizador
    // autenticado no está anotado, así que recibe 404 (no 204).
    setAuthUser({
      uid: 'e2e-uid-organizador',
      email: 'organizador@e2e.test',
      nombre: 'Organizador E2E',
    });
    await request(server)
      .delete(`/partidos/${partido.id}/participantes/me`)
      .expect(404);
  });

  it('[AC-7] el service no importa PrismaService', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const servicePath = path.join(
      __dirname.replace(/test$/, 'src'),
      'partidos',
      'partidos.service.ts',
    );
    const source = fs.readFileSync(servicePath, 'utf-8');

    expect(source).not.toMatch(/from ['"].*prisma\.service['"]/);
    expect(source).not.toMatch(/PrismaService/);
  });
});
