import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import type { FirebaseUser } from '../auth/types';
import { CreatePartidoDto } from './dto/create-partido.dto';
import { UpdatePartidoDto } from './dto/update-partido.dto';
import { PartidosService } from './partidos.service';

@UseGuards(FirebaseAuthGuard)
@Controller('partidos')
export class PartidosController {
  constructor(private readonly partidosService: PartidosService) {}

  @Post()
  create(
    @CurrentUser() user: FirebaseUser,
    @Body() createPartidoDto: CreatePartidoDto,
  ) {
    return this.partidosService.create(user.uid, createPartidoDto);
  }

  @Post(':id/participantes')
  join(@Param('id') id: string, @CurrentUser() user: FirebaseUser) {
    return this.partidosService.join(id, user.uid);
  }

  @Get()
  findAll() {
    return this.partidosService.findUpcoming();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partidosService.findOne(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: FirebaseUser,
    @Param('id') id: string,
    @Body() updatePartidoDto: UpdatePartidoDto,
  ) {
    return this.partidosService.update(user.uid, id, updatePartidoDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: FirebaseUser, @Param('id') id: string) {
    return this.partidosService.remove(user.uid, id);
  }
}
