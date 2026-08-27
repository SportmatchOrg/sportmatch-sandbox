/**
 * Spec de ejemplo — RF-03 Creación de partido.
 *
 * Escrito a mano (plan, fase 0b). Es la referencia de estilo que el agente
 * recibe en la precarga, y la prueba de que el oráculo funciona antes de que
 * ningún modelo escriba una línea.
 *
 * Convención obligatoria: cada `it()` arranca con `[AC-n]`. El validador
 * extrae esos identificadores con una regex y los cruza contra los criterios de
 * aceptación del ticket de Linear, para que la cobertura sea un dato medido y
 * no algo que el modelo se autodeclara (plan §8).
 */
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

describe('Partidos (RF-03)', () => {
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

  it('[AC-3] rechaza una fecha en el pasado', async () => {
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { fecha: '2020-01-01T18:00:00.000Z' }))
      .expect(400);
  });

  it('[AC-4] rechaza campos que no están en el DTO', async () => {
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId, { campoInventado: 'x' }))
      .expect(400);
  });

  it('[AC-5] lista los partidos próximos', async () => {
    await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    const response = await request(server).get('/partidos').expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ anotados: 0 });
  });

  it('[AC-6] devuelve 404 para un partido inexistente', async () => {
    await request(server).get('/partidos/no-existe').expect(404);
  });

  it('[AC-7] solo el organizador puede modificar el partido', async () => {
    const creado = await request(server)
      .post('/partidos')
      .send(partidoPayload(deporteId))
      .expect(201);

    setAuthUser(OTHER_USER);

    await request(server)
      .patch(`/partidos/${creado.body.id}`)
      .send({ ubicacion: 'Cancha secuestrada' })
      .expect(403);
  });
});
