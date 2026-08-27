import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartidoDto } from './dto/create-partido.dto';
import { UpdatePartidoDto } from './dto/update-partido.dto';

const PUBLIC_ORGANIZER = {
  select: { id: true, nombre: true, fotoUrl: true },
} as const;

const PARTICIPANT_COUNT = {
  select: { participantes: true },
} as const;

const PARTIDO_INCLUDE = {
  organizador: PUBLIC_ORGANIZER,
  _count: PARTICIPANT_COUNT,
} as const;

@Injectable()
export class PartidosRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUpcoming() {
    return this.prisma.partido.findMany({
      where: { fecha: { gte: new Date() } },
      orderBy: { fecha: 'asc' },
      include: PARTIDO_INCLUDE,
    });
  }

  findById(id: string) {
    return this.prisma.partido.findUnique({
      where: { id },
      include: PARTIDO_INCLUDE,
    });
  }

  create(organizadorId: string, data: CreatePartidoDto) {
    return this.prisma.partido.create({
      data: { ...data, organizadorId },
      include: PARTIDO_INCLUDE,
    });
  }

  update(id: string, data: UpdatePartidoDto) {
    return this.prisma.partido.update({
      where: { id },
      data,
      include: PARTIDO_INCLUDE,
    });
  }

  remove(id: string) {
    return this.prisma.partido.delete({ where: { id } });
  }

  findParticipant(partidoId: string, usuarioId: string) {
    return this.prisma.participante.findUnique({
      where: { partidoId_usuarioId: { partidoId, usuarioId } },
    });
  }

  addParticipant(partidoId: string, usuarioId: string) {
    return this.prisma.participante.create({
      data: { partidoId, usuarioId },
    });
  }
}
