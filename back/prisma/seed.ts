import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { inDays } from '../src/utils/time/in-days';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const NOMBRES_DEPORTES = ['FUTBOL', 'BASQUET', 'TENIS', 'PADEL', 'RUNNING'];

async function main() {
  const deportes = await Promise.all(
    NOMBRES_DEPORTES.map((nombre) =>
      prisma.deporte.upsert({
        where: { nombre },
        update: {},
        create: { nombre },
      }),
    ),
  );

  const deporteId = (nombre: string): string => {
    const deporte = deportes.find((candidato) => candidato.nombre === nombre);

    if (!deporte) {
      throw new Error(`Deporte ${nombre} was not seeded`);
    }

    return deporte.id;
  };

  const ana = await prisma.user.upsert({
    where: { firebaseUid: 'seed-uid-1' },
    update: {},
    create: {
      firebaseUid: 'seed-uid-1',
      email: 'ana@sportmatch.dev',
      nombre: 'Ana Gómez',
    },
  });

  const luis = await prisma.user.upsert({
    where: { firebaseUid: 'seed-uid-2' },
    update: {},
    create: {
      firebaseUid: 'seed-uid-2',
      email: 'luis@sportmatch.dev',
      nombre: 'Luis Pérez',
    },
  });

  await prisma.partido.deleteMany();

  await prisma.partido.createMany({
    data: [
      {
        deporteId: deporteId('FUTBOL'),
        nivel: 'INTERMEDIO',
        fecha: inDays(2, 19),
        ubicacion: 'Parque Sur',
        cupo: 10,
        descripcion: 'Faltan dos para completar los equipos',
        organizadorId: ana.id,
      },
      {
        deporteId: deporteId('PADEL'),
        nivel: 'PRINCIPIANTE',
        fecha: inDays(3, 20),
        ubicacion: 'Club Norte · Cancha 3',
        cupo: 4,
        organizadorId: luis.id,
      },
      {
        deporteId: deporteId('BASQUET'),
        nivel: 'AVANZADO',
        fecha: inDays(5, 21),
        ubicacion: 'Polideportivo Municipal',
        cupo: 10,
        organizadorId: ana.id,
      },
      {
        deporteId: deporteId('TENIS'),
        nivel: 'INTERMEDIO',
        fecha: inDays(7, 18),
        ubicacion: 'River Courts · Cancha 2',
        cupo: 2,
        descripcion: 'Singles, traer pelotas',
        organizadorId: luis.id,
      },
      {
        deporteId: deporteId('RUNNING'),
        nivel: 'PRINCIPIANTE',
        fecha: inDays(9, 8),
        ubicacion: 'Costanera, kilómetro 0',
        cupo: 15,
        descripcion: 'Ritmo suave, 5 km',
        organizadorId: ana.id,
      },
      {
        deporteId: deporteId('FUTBOL'),
        nivel: 'AVANZADO',
        fecha: inDays(12, 22),
        ubicacion: 'Complejo Del Este',
        cupo: 14,
        organizadorId: luis.id,
      },
    ],
  });

  const partidosCreados = await prisma.partido.findMany({
    orderBy: { fecha: 'asc' },
  });

  await prisma.participante.createMany({
    data: partidosCreados.slice(0, 3).map((partido) => ({
      partidoId: partido.id,
      usuarioId: partido.organizadorId === ana.id ? luis.id : ana.id,
    })),
  });
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
