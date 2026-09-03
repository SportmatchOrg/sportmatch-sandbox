import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartidoDto } from './dto/create-partido.dto';
import { UpdatePartidoDto } from './dto/update-partido.dto';

const PUBLIC_ORGANIZER = {
  select: { id: true, nombre: true, fotoUrl: true },
} as const;

const PUBLIC_DEPORTE = {
  select: { id: true, nombre: true },
} as const;

const PARTICIPANT_COUNT = {
  select: { participantes: true },
} as const;

const PUBLIC_PARTICIPANTS = {
  select: {
    usuario: { select: { id: true, nombre: true, fotoUrl: true } },
    createdAt: true,
  },
  orderBy: { createdAt: 'asc' },
} as const;

const partidoInclude = (usuarioId: string) =>
  ({
    organizador: PUBLIC_ORGANIZER,
    deporte: PUBLIC_DEPORTE,
    _count: PARTICIPANT_COUNT,
    participantes: { where: { usuarioId }, select: { id: true } },
  }) as const;

@Injectable()
export class PartidosRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUpcoming(usuarioId: string) {
    return this.prisma.partido.findMany({
      where: { fecha: { gte: new Date() } },
      orderBy: { fecha: 'asc' },
      include: partidoInclude(usuarioId),
    });
  }

  findById(id: string, usuarioId: string) {
    return this.prisma.partido.findUnique({
      where: { id },
      include: partidoInclude(usuarioId),
    });
  }

  findDetailById(id: string) {
    return this.prisma.partido.findUnique({
      where: { id },
      include: {
        organizador: PUBLIC_ORGANIZER,
        deporte: PUBLIC_DEPORTE,
        _count: PARTICIPANT_COUNT,
        participantes: PUBLIC_PARTICIPANTS,
      },
    });
  }

  create(organizadorId: string, data: CreatePartidoDto) {
    return this.prisma.partido.create({
      data: { ...data, organizadorId },
      include: partidoInclude(organizadorId),
    });
  }

  update(id: string, usuarioId: string, data: UpdatePartidoDto) {
    return this.prisma.partido.update({
      where: { id },
      data,
      include: partidoInclude(usuarioId),
    });
  }

  remove(id: string) {
    return this.prisma.partido.delete({ where: { id } });
  }

  addParticipant(partidoId: string, usuarioId: string) {
    return this.prisma.participante.create({
      data: { partidoId, usuarioId },
    });
  }

  removeParticipant(partidoId: string, usuarioId: string) {
    return this.prisma.participante.delete({
      where: { partidoId_usuarioId: { partidoId, usuarioId } },
    });
  }
}
