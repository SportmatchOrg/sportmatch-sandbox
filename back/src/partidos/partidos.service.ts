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
import type { DetailedPartido, ListedPartido } from './types';
@Injectable()
export class PartidosService {
  constructor(
    private readonly partidosRepository: PartidosRepository,
    private readonly usersService: UsersService,
  ) {}

  async findUpcoming(firebaseUid: string) {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    const partidos = await this.partidosRepository.findUpcoming(user.id);

    return partidos.map((partido) => this.toListResponse(partido));
  }

  async findOne(firebaseUid: string, id: string) {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    const partido = await this.partidosRepository.findDetailById(id);

    if (!partido) {
      throw new NotFoundException(`Partido with id ${id} was not found`);
    }

    return this.toDetailResponse(partido, user.id);
  }

  async create(firebaseUid: string, createPartidoDto: CreatePartidoDto) {
    this.assertFutureDate(createPartidoDto.fecha);

    const organizer = await this.usersService.findByFirebaseUid(firebaseUid);

    try {
      const partido = await this.partidosRepository.create(
        organizer.id,
        createPartidoDto,
      );

      return this.toListResponse(partido);
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

    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    await this.assertIsOrganizer(user.id, id);

    try {
      const partido = await this.partidosRepository.update(
        id,
        user.id,
        updatePartidoDto,
      );

      return this.toListResponse(partido);
    } catch (error) {
      throw this.toHttpException(error, id);
    }
  }

  async remove(firebaseUid: string, id: string) {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    await this.assertIsOrganizer(user.id, id);

    try {
      return await this.partidosRepository.remove(id);
    } catch (error) {
      throw this.toHttpException(error, id);
    }
  }

  async join(firebaseUid: string, partidoId: string) {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    const partido = await this.getOrFail(partidoId, user.id);

    this.assertNotPlayed(partido.fecha);

    if (partido.organizadorId === user.id) {
      throw new BadRequestException(
        'The organizer is already part of the partido',
      );
    }

    if (partido._count.participantes >= partido.cupo) {
      throw new ConflictException('The partido is full');
    }

    if (partido.participantes.length > 0) {
      throw new ConflictException('You already joined this partido');
    }

    try {
      return await this.partidosRepository.addParticipant(partidoId, user.id);
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  async leave(firebaseUid: string, partidoId: string) {
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    const partido = await this.getOrFail(partidoId, user.id);

    this.assertNotPlayed(partido.fecha);

    if (partido.participantes.length === 0) {
      throw new NotFoundException('You are not joined to this partido');
    }

    try {
      await this.partidosRepository.removeParticipant(partidoId, user.id);
    } catch (error) {
      throw this.toHttpException(error, partidoId);
    }
  }

  private async getOrFail(id: string, usuarioId: string) {
    const partido = await this.partidosRepository.findById(id, usuarioId);

    if (!partido) {
      throw new NotFoundException(`Partido with id ${id} was not found`);
    }

    return partido;
  }

  private toListResponse<T extends ListedPartido>(partido: T) {
    const { _count, participantes, ...rest } = partido;

    return {
      ...rest,
      anotados: _count.participantes,
      estoy_anotado: participantes.length > 0,
    };
  }

  private toDetailResponse<T extends DetailedPartido>(
    partido: T,
    usuarioId: string,
  ) {
    const { _count, participantes, ...rest } = partido;

    return {
      ...rest,
      anotados: _count.participantes,
      estoy_anotado: participantes.some(
        ({ usuario }) => usuario.id === usuarioId,
      ),
      participantes: participantes.map(({ usuario }) => usuario),
    };
  }

  private assertFutureDate(fecha: Date) {
    if (fecha.getTime() <= Date.now()) {
      throw new BadRequestException('fecha must be in the future');
    }
  }

  private assertNotPlayed(fecha: Date) {
    if (fecha.getTime() <= Date.now()) {
      throw new BadRequestException('The partido has already been played');
    }
  }

  private async assertIsOrganizer(usuarioId: string, partidoId: string) {
    const partido = await this.getOrFail(partidoId, usuarioId);

    if (partido.organizadorId !== usuarioId) {
      throw new ForbiddenException(
        'Only the organizer can modify this partido',
      );
    }
  }

  private toHttpException(error: unknown, reference?: string): Error {
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
        return new NotFoundException(
          reference
            ? `Partido with id ${reference} was not found`
            : 'Partido was not found',
        );
      }
    }

    return error instanceof Error ? error : new Error(String(error));
  }
}
