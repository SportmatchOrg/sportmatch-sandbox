import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeportesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.deporte.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
  }
}
