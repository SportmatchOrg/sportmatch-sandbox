import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PartidosController } from './partidos.controller';
import { PartidosRepository } from './partidos.repository';
import { PartidosService } from './partidos.service';

@Module({
  imports: [UsersModule],
  controllers: [PartidosController],
  providers: [PartidosService, PartidosRepository],
})
export class PartidosModule {}
