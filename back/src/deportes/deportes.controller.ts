import { Controller, Get, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { DeportesService } from './deportes.service';

@UseGuards(FirebaseAuthGuard)
@Controller('deportes')
export class DeportesController {
  constructor(private readonly deportesService: DeportesService) {}

  @Get()
  findAll() {
    return this.deportesService.findAll();
  }
}
