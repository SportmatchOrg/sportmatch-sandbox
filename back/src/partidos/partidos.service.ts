import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { UsersService } from '../users/users.service';
import { CreatePartidoDto } from './dto/create-partido.dto';
import { UpdatePartidoDto } from './dto/update-partido.dto';
import { PartidosRepository } from './partidos.repository';

type WithParticipantCount = { _count: { participantes: number } };

@Injectable()
export class PartidosService {
  constructor(
    private readonly partidosRepository: PartidosRepository,
    private readonly usersService: UsersService,
  ) {}

  async findUpcoming() {
    const partidos = await this.partidosRepository.findUpcoming();

    return partidos.map((partido) => this.withParticipantCount(partido));
  }

  async findOne(id: string) {
    const partido = await this.partidosRepository.findById(id);

    if (!partido) {
      throw new NotFoundException(`Partido with id ${id} was not found`);
    }

    return this.withParticipantCount(partido);
  }

  async create(firebaseUid: string, createPartidoDto: CreatePartidoDto) {
    this.assertFutureDate(createPartidoDto.fecha);

    const organizer = await this.usersService.findByFirebaseUid(firebaseUid);

    try {
      const partido = await this.partidosRepository.create(
        organizer.id,
        createPartidoDto,
      );

      return this.withParticipantCount(partido);
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  async update(
    firebaseUid: string,
    id: string,
    updatePartidoDto: UpdatePartidoDto,
  ) {
    if (updatePartidoDto.fecha) {
      this.assertFutureDate(updatePartidoDto.fecha);
    }

    await this.assertIsOrganizer(firebaseUid, id);

    try {
      const partido = await this.partidosRepository.update(
        id,
        updatePartidoDto,
      );

      return this.withParticipantCount(partido);
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  async remove(firebaseUid: string, id: string) {
    await this.assertIsOrganizer(firebaseUid, id);

    try {
      return await this.partidosRepository.remove(id);
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  async join(partidoId: string, firebaseUid: string) {
    const partido = await this.findOne(partidoId);

    if (partido.fecha.getTime() <= Date.now()) {
      throw new BadRequestException('The partido has already been played');
    }

    const user = await this.usersService.findByFirebaseUid(firebaseUid);

    if (partido.organizadorId === user.id) {
      throw new BadRequestException(
        'The organizer is already part of the partido',
      );
    }

    if (partido.anotados >= partido.cupo) {
      throw new ConflictException('The partido is full');
    }

    const existingParticipant = await this.partidosRepository.findParticipant(
      partidoId,
      user.id,
    );

    if (existingParticipant) {
      throw new ConflictException('You already joined this partido');
    }

    try {
      return await this.partidosRepository.addParticipant(partidoId, user.id);
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  private withParticipantCount<T extends WithParticipantCount>(partido: T) {
    const { _count, ...rest } = partido;

    return { ...rest, anotados: _count.participantes };
  }

  private assertFutureDate(fecha: Date) {
    if (fecha.getTime() <= Date.now()) {
      throw new BadRequestException('fecha must be in the future');
    }
  }

  private async assertIsOrganizer(firebaseUid: string, partidoId: string) {
    const partido = await this.findOne(partidoId);
    const user = await this.usersService.findByFirebaseUid(firebaseUid);

    if (partido.organizadorId !== user.id) {
      throw new ForbiddenException(
        'Only the organizer can modify this partido',
      );
    }
  }

  private toHttpException(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return new ConflictException('You already joined this partido');
      }

      if (error.code === 'P2003') {
        return new BadRequestException(
          'deporteId does not match a known sport',
        );
      }

      if (error.code === 'P2025') {
        return new NotFoundException('Partido was not found');
      }
    }

    return error instanceof Error ? error : new Error(String(error));
  }
}
