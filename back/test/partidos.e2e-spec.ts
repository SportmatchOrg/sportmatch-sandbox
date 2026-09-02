import request from 'supertest';
import type { Server } from 'http';
import {
  closeTestApp,
  createTestApp,
  resetDatabase,
  setAuthUser,
  type TestContext,
} from './setup-e2e';
import { OTHER_USER, TEST_USER, partidoPayload, seedBaseline, futureDate } from './fixtures';

describe('Partidos (e2e)', () => {
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
    const baseline = await seedBaseline(ctx.prisma);
    deporteId = baseline.deporteId;
    organizadorId = baseline.organizadorId;
    otroId = baseline.otroId;
  });

  it('[AC-1] crea un partido válido y lo devuelve sin anotados', async () => {
    const response = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    expect(response.body).toMatchObject({
      ubicacion: 'Cancha E2E',
      cupo: 10,
      anotados: 0,
    });
    expect(response.body.id).toEqual(expect.any(String));
  });

  it('[AC-2] rechaza un cupo menor al mínimo de 2', async () => {
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { cupo: 1 }))
      .expect(400);
  });

  it('[AC-3] rechaza un cupo mayor al máximo de 30', async () => {
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { cupo: 31 }))
      .expect(400);
  });

  it('[AC-4] rechaza una fecha en el pasado', async () => {
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { fecha: '2020-01-01T18:00:00.000Z' }))
      .expect(400);
  });

  it('[AC-5] requiere un deporteId válido (FK)', async () => {
    await request(server)
      .post('/partidos')
      .send(partidoPayload('deporte-inexistente'))
      .expect(400);
  });

  it('[AC-6] requiere un nivel de enum válido', async () => {
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { nivel: 'EXPERTO' as any }))
      .expect(400);
  });

  it('[AC-7] rechaza ubicacion con menos de 3 caracteres', async () => {
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { ubicacion: 'Ab' }))
      .expect(400);
  });

  it('[AC-8] rechaza ubicacion con más de 120 caracteres', async () => {
    const longUbicacion = 'a'.repeat(121);
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { ubicacion: longUbicacion }))
      .expect(400);
  });

  it('[AC-9] acepta descripcion opcional y hasta 500 caracteres', async () => {
    const desc500 = 'a'.repeat(500);
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { descripcion: desc500 }))
      .expect(201);

    const desc501 = 'a'.repeat(501);
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { descripcion: desc501 }))
      .expect(400);
  });

  it('[AC-10] lista los partidos próximos (findUpcoming)', async () => {
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    const response = await request(server).get('/partidos').expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ anotados: 0 });
  });

  it('[AC-11] obtiene un partido por id existente', async () => {
    const creado = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    const response = await request(server)
      .get(`/partidos/${creado.body.id}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: creado.body.id,
      ubicacion: 'Cancha E2E',
      cupo: 10,
      anotados: 0,
    });
  });

  it('[AC-12] devuelve 404 para un partido inexistente', async () => {
    await request(server).get('/partidos/id-inexistente').expect(404);
  });

  it('[AC-13] solo el organizador puede actualizar el partido (éxito)', async () => {
    const creado = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    await request(server)
      .patch(`/partidos/${creado.body.id}`)
      .send({ ubicacion: 'Cancha Actualizada' })
      .expect(200);
  });

  it('[AC-14] un usuario que no es el organizador no puede actualizar el partido', async () => {
    const creado = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    setAuthUser(OTHER_USER);

    await request(server)
      .patch(`/partidos/${creado.body.id}`)
      .send({ ubicacion: 'Intento de secuestro' })
      .expect(403);

    // reset auth for other tests
    setAuthUser(TEST_USER);
  });

  it('[AC-15] solo el organizador puede eliminar el partido (éxito)', async () => {
    const creado = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    await request(server)
      .delete(`/partidos/${creado.body.id}`)
      .expect(200);
  });

  it('[AC-16] un usuario que no es el organizador no puede eliminar el partido', async () => {
    const creado = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    setAuthUser(OTHER_USER);

    await request(server)
      .delete(`/partidos/${creado.body.id}`)
      .expect(403);

    setAuthUser(TEST_USER);
  });

  it('[AC-17] un usuario puede unirse a un partido como participante', async () => {
    const creado = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    setAuthUser(OTHER_USER);

    await request(server)
      .post(`/partidos/${creado.body.id}/participantes`)
      .expect(201); // unirse devuelve 201

    setAuthUser(TEST_USER);
  });

  it('[AC-18] no puede unirse dos veces al mismo partido', async () => {
    const creado = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    setAuthUser(OTHER_USER);

    // primera unión
    await request(server)
      .post(`/partidos/${creado.body.id}/participantes`)
      .expect(201);

    // segunda unión -> conflicto
    await request(server)
      .post(`/partidos/${creado.body.id}/participantes`)
      .expect(409);

    setAuthUser(TEST_USER);
  });

  it('[AC-19] no puede unirse cuando el partido está lleno', async () => {
    const creado = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { cupo: 2 }))
      .expect(201);

    // primer participante (otro usuario)
    setAuthUser(OTHER_USER);
    await request(server)
      .post(`/partidos/${creado.body.id}/participantes`)
      .expect(201);

    // segundo participante (organizador) - debería llenar
    setAuthUser(TEST_USER);
    await request(server)
      .post(`/partidos/${creado.body.id}/participantes`)
      .expect(201);

    // tercer intento -> lleno
    const tercerUsuario = {
      uid: 'e2e-uid-tercer',
      email: 'tercer@e2e.test',
      nombre: 'Tercer E2E',
    };
    // Crear el tercer usuario en la base de datos
    await ctx.prisma.user.create({
      data: {
        firebaseUid: tercerUsuario.uid,
        email: tercerUsuario.email,
        nombre: tercerUsuario.nombre,
      },
    });
    setAuthUser(tercerUsuario);
    await request(server)
      .post(`/partidos/${creado.body.id}/participantes`)
      .expect(409); // ConflictException: The partido is full

    setAuthUser(TEST_USER);
  });

  it('[AC-20] no puede unirse a un partido que ya pasó (fecha en el pasado)', async () => {
    // Crear partido con fecha futura
    const futuro = futureDate(7);
    const creadoFuture = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { fecha: futuro.toISOString() }))
      .expect(201);

    // Actualizar la fecha directamente en la base de datos a una fecha pasada
    const pasado = new Date('2020-01-01T18:00:00.000Z');
    await ctx.prisma.partido.update({
      where: { id: creadoFuture.body.id },
      data: { fecha: pasado },
    });

    // Otro usuario intenta unirse
    setAuthUser(OTHER_USER);
    await request(server)
      .post(`/partidos/${creadoFuture.body.id}/participantes`)
      .expect(400); // BadRequestException: The partido has already been played

    setAuthUser(TEST_USER);
  });

  it('[AC-21] el organizador no puede unirse a su propio partido', async () => {
    const creado = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    // El organizador ya está autenticado por defecto (TEST_USER)
    await request(server)
      .post(`/partidos/${creado.body.id}/participantes`)
      .expect(400); // BadRequestException: The organizer is already part of the partido
  });
});
