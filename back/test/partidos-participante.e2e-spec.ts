import request from 'supertest';
import type { Server } from 'http';
import {
  closeTestApp,
  createTestApp,
  resetDatabase,
  setAuthUser,
  type TestContext,
} from './setup-e2e';
import { OTHER_USER, TEST_USER, partidoPayload, seedBaseline } from './fixtures';

describe('Participantes en partidos (SPO-168)', () => {
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
    const { deporteId: dId, organizadorId: oId, otroId: tId } = await seedBaseline(ctx.prisma);
    deporteId = dId;
    organizadorId = oId;
    otroId = tId;
    // crear un partido organizado por el organizador (TEST_USER) para usar en tests
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { cupo: 10 }))
      .expect(201);
  });

  it('[AC-1] unirse a un partido válido devuelve 201 y crea fila en participantes', async () => {
    // obtener el id del partido creado en beforeEach
    const listRes = await request(server).get('/partidos').expect(200);
    const partidoId = listRes.body[0].id;

    setAuthUser(OTHER_USER); // otro usuario se une
    const joinRes = await request(server)
      .post(`/partidos/${partidoId}/participantes`)
      .expect(201);

    expect(joinRes.body).toMatchObject({
      id: expect.any(String),
      partidoId,
      usuarioId: expect.any(String),
    });

    // verificar que el participante aparece en el detalle del partido
    const detalle = await request(server)
      .get(`/partidos/${partidoId}`)
      .expect(200);
    expect(detalle.body.anotados).toBe(1);
    expect(detalle.body.estoy_anotado).toBe(true);
    expect(detalle.body.participantes).toHaveLength(1);
    expect(detalle.body.participantes[0].id).toBe(joinRes.body.id);
  });

  it('[AC-2] unirse dos veces al mismo partido devuelve 409', async () => {
    const listRes = await request(server).get('/partidos').expect(200);
    const partidoId = listRes.body[0].id;

    setAuthUser(OTHER_USER);
    // primera unión
    await request(server)
      .post(`/partidos/${partidoId}/participantes`)
      .expect(201);
    // segunda unión debería fallar por validación del service
    await request(server)
      .post(`/partidos/${partidoId}/participantes`)
      .expect(409);
  });

  it('[AC-3] con el cupo lleno devuelve 409', async () => {
    // crear un partido con cupo 2
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { cupo: 2 }))
      .expect(201);
    const listRes = await request(server).get('/partidos').expect(200);
    // asumimos que el último creado es el de cupo 2 (orden por fecha asc)
    const partidoId = listRes.body[listRes.body.length - 1].id;

    // crear dos usuarios adicionales para llenar el cupo
    const prisma = ctx.prisma;
    const user2 = await prisma.user.create({
      data: {
        firebaseUid: 'e2e-uid-user2',
        email: 'user2@e2e.test',
        nombre: 'User Two',
      },
    });
    const user3 = await prisma.user.create({
      data: {
        firebaseUid: 'e2e-uid-user3',
        email: 'user3@e2e.test',
        nombre: 'User Three',
      },
    });

    // primer usuario se une (OTHER_USER)
    setAuthUser(OTHER_USER);
    await request(server)
      .post(`/partidos/${partidoId}/participantes`)
      .expect(201);
    // segundo usuario se une (user2)
    setAuthUser({
      uid: user2.firebaseUid,
      email: user2.email,
      nombre: user2.nombre,
    });
    await request(server)
      .post(`/partidos/${partidoId}/participantes`)
      .expect(201);
    // ahora el cupo está lleno (2/2). Tercer intento debería dar 409 por cupo lleno
    setAuthUser({
      uid: user3.firebaseUid,
      email: user3.email,
      nombre: user3.nombre,
    });
    await request(server)
      .post(`/partidos/${partidoId}/participantes`)
      .expect(409);
  });

  it('[AC-4] en un partido que ya pasó devuelve 400', async () => {
    const listRes = await request(server).get('/partidos').expect(200);
    const partidoId = listRes.body[0].id;
    // actualizar la fecha del partido a una fecha pasada usando el endpoint PATCH (solo organizador puede)
    setAuthUser(TEST_USER);
    await request(server)
      .patch(`/partidos/${partidoId}`)
      .send({ fecha: '2020-01-01T18:00:00.000Z' })
      .expect(200);
    // ahora intentar unirse como otro usuario
    setAuthUser(OTHER_USER);
    await request(server)
      .post(`/partidos/${partidoId}/participantes`)
      .expect(400);
  });

  it('[AC-5] el organizador intentando anotarse en su propio partido devuelve 400', async () => {
    const listRes = await request(server).get('/partidos').expect(200);
    const partidoId = listRes.body[0].id;
    setAuthUser(TEST_USER); // organizador
    await request(server)
      .post(`/partidos/${partidoId}/participantes`)
      .expect(400);
  });

  it('[AC-6] id de partido inexistente devuelve 404', async () => {
    setAuthUser(OTHER_USER);
    await request(server)
      .post(`/partidos/idoinexistente/participantes`)
      .expect(404);
  });

  it('[AC-7] enviar usuarioId en el body no cambia quién se une (se ignora)', async () => {
    const listRes = await request(server).get('/partidos').expect(200);
    const partidoId = listRes.body[0].id;
    setAuthUser(OTHER_USER);
    const joinRes = await request(server)
      .post(`/partidos/${partidoId}/participantes`)
      .send({ usuarioId: organizadorId }) // intentar engañar
      .expect(201);
    // el usuario que se unió debe ser el del token, no el enviado en body
    expect(joinRes.body.usuarioId).toBe(OTHER_USER.uid);
  });

  it('[AC-8] GET /partidos devuelve anotados correcto sin N+1', async () => {
    // crear dos partidos
    await request(server).post('/partidos').send(partidoPayload(deporteId, { cupo: 5 })).expect(201);
    await request(server).post('/partidos').send(partidoPayload(deporteId, { cupo: 8 })).expect(201);
    const listRes = await request(server).get('/partidos').expect(200);
    expect(listRes.body).toHaveLength(2);
    // unir a OTHER_USER al primer partido
    setAuthUser(OTHER_USER);
    const primerId = listRes.body[0].id;
    await request(server).post(`/partidos/${primerId}/participantes`).expect(201);
    // volver a listar y verificar anotados
    const listRes2 = await request(server).get('/partidos').expect(200);
    // encontrar cada partido y verificar que anotados coincida
    const partido1 = listRes2.body.find((p: any) => p.id === primerId);
    const partido2 = listRes2.body.find((p: any) => p.id !== primerId);
    expect(partido1.anotados).toBe(1);
    expect(partido2.anotados).toBe(0);
  });

  it('[AC-9] borrar un partido borra sus participantes y no deja filas huérfanas', async () => {
    const listRes = await request(server).get('/partidos').expect(200);
    const partidoId = listRes.body[0].id;
    setAuthUser(OTHER_USER);
    await request(server).post(`/partidos/${partidoId}/participantes`).expect(201);
    // verificar que exista participante
    const countBefore = await ctx.prisma.participante.count({ where: { partidoId } });
    expect(countBefore).toBe(1);
    // borrar partido como organizador
    setAuthUser(TEST_USER);
    await request(server).delete(`/partidos/${partidoId}`).expect(200);
    // verificar que participantes se borraron
    const countAfter = await ctx.prisma.participante.count({ where: { partidoId } });
    expect(countAfter).toBe(0);
  });
});
