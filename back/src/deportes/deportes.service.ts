import { Injectable } from '@nestjs/common';
import { DeportesRepository } from './deportes.repository';

@Injectable()
export class DeportesService {
  constructor(private readonly deportesRepository: DeportesRepository) {}

  findAll() {
    return this.deportesRepository.findAll();
  }
}
