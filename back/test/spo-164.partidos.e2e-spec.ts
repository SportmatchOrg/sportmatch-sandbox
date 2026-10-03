import request from 'supertest';
import type { Server } from 'http';
import { PartidosController } from '../src/partidos/partidos.controller';
import { FirebaseAuthGuard } from '../src/auth/firebase-auth.guard';
import {
  closeTestApp,
  createTestApp,
  resetDatabase,
  setAuthUser,
  type TestContext,
} from './setup-e2e';
import { OTHER_USER, partidoPayload, seedBaseline } from './fixtures';

describe('SPO-164 — Partidos CRUD', () => {
  let ctx: TestContext;
  let server: Server;
  let deporteId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    server = ctx.app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    ({ deporteId } = await seedBaseline(ctx.prisma));
  });

  it('[AC-3] POST usa el usuario del token como organizador y rechaza organizadorId en el body', async () => {
    const creado = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    const partidoEnDb = await ctx.prisma.partido.findFirstOrThrow({
      where: { id: creado.body.id },
      include: { organizador: true },
    });

    // El organizador del partido debe ser TEST_USER (el del token)
    expect(partidoEnDb.organizador.firebaseUid).toBe('e2e-uid-organizador');
    expect(partidoEnDb.organizadorId).toBe(partidoEnDb.organizador.id);

    // Mandar organizadorId en el body debe ser rechazado (400)
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { organizadorId: 'cualquier-cosa' }))
      .expect(400);

    // Sólo se creó el primero
    const total = await ctx.prisma.partido.count();
    expect(total).toBe(1);
  });

  it('[AC-4] GET /partidos devuelve sólo futuros ordenados ascendente', async () => {
    const org = await ctx.prisma.user.findFirstOrThrow();

    // Pasado: NO debe aparecer
    await ctx.prisma.partido.create({
      data: {
        deporteId,
        nivel: 'PRINCIPIANTE',
        fecha: new Date('2020-01-01T18:00:00.000Z'),
        ubicacion: 'Viejo',
        cupo: 10,
        organizadorId: org.id,
      },
    });

    // Futuro lejano: debe aparecer segundo
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { ubicacion: 'Lejano' }))
      .expect(201);

    // Futuro cercano: debe aparecer primero
    const cercano = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { ubicacion: 'Cercano' }))
      .expect(201);

    const response = await request(server).get('/partidos').expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].id).toBe(cercano.body.id);
    expect(response.body[0].ubicacion).toBe('Cercano');
    expect(response.body[1].ubicacion).toBe('Lejano');

    const f0 = new Date(response.body[0].fecha).getTime();
    const f1 = new Date(response.body[1].fecha).getTime();
    expect(f0).toBeLessThanOrEqual(f1);

    const ubicaciones = response.body.map((p: { ubicacion: string }) => p.ubicacion);
    expect(ubicaciones).not.toContain('Viejo');
  });

  it('[AC-5] la respuesta incluye organizador con id/nombre/fotoUrl y NO expone email ni firebaseUid', async () => {
    const creado = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    const detalle = await request(server)
      .get(`/partidos/${creado.body.id}`)
      .expect(200);

    expect(detalle.body.organizador).toEqual({
      id: expect.any(String),
      nombre: expect.any(String),
      fotoUrl: null,
    });

    expect(detalle.body.organizador.email).toBeUndefined();
    expect(detalle.body.organizador.firebaseUid).toBeUndefined();
  });

  it('[AC-6] PATCH/DELETE ajeno devuelve 403; id inexistente devuelve 404', async () => {
    const creado = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    setAuthUser(OTHER_USER);

    // Ajeno => 403 (no es el organizador)
    await request(server)
      .patch(`/partidos/${creado.body.id}`)
      .send({ ubicacion: 'Secuestrado' })
      .expect(403);

    await request(server)
      .delete(`/partidos/${creado.body.id}`)
      .expect(403);

    // id inexistente => 404 (payload válido para superar el ValidationPipe)
    await request(server)
      .patch('/partidos/no-existe')
      .send({ ubicacion: 'Otra ubicación válida' })
      .expect(404);

    await request(server)
      .delete('/partidos/no-existe')
      .expect(404);

    // El partido sigue existiendo y no fue modificado
    const sigue = await ctx.prisma.partido.findFirstOrThrow({
      where: { id: creado.body.id },
    });
    expect(sigue.ubicacion).toBe('Cancha E2E');
  });

  it('[AC-7] crear con fecha pasada, cupo 1 o deporte inexistente devuelve 400', async () => {
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { fecha: '2020-01-01T18:00:00.000Z' }))
      .expect(400);

    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { cupo: 1 }))
      .expect(400);

    await request(server)
      .post('/partidos')
      .send(partidoPayload('deporte-que-no-existe'))
      .expect(400);

    const total = await ctx.prisma.partido.count();
    expect(total).toBe(0);
  });

  it('[AC-8] el controller aplica FirebaseAuthGuard a nivel de clase', async () => {
    // El harness mockea el guard para que siempre pase. Verificamos por
    // reflection que el controller declara @UseGuards(FirebaseAuthGuard).
    const classGuards: unknown[] =
      Reflect.getMetadata('__guards__', PartidosController) ?? [];
    expect(classGuards.length).toBeGreaterThan(0);
    expect(classGuards[0]).toBe(FirebaseAuthGuard);
  });
});
