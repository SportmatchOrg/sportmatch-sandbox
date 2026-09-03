import { Module } from '@nestjs/common';
import { DeportesController } from './deportes.controller';
import { DeportesRepository } from './deportes.repository';
import { DeportesService } from './deportes.service';

@Module({
  controllers: [DeportesController],
  providers: [DeportesService, DeportesRepository],
  exports: [DeportesService],
})
export class DeportesModule {}
