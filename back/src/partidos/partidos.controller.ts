import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  join(@CurrentUser() user: FirebaseUser, @Param('id') id: string) {
    return this.partidosService.join(user.uid, id);
  }

  @Delete(':id/participantes/me')
  @HttpCode(HttpStatus.NO_CONTENT)
  leave(@CurrentUser() user: FirebaseUser, @Param('id') id: string) {
    return this.partidosService.leave(user.uid, id);
  }

  @Get()
  findAll(@CurrentUser() user: FirebaseUser) {
    return this.partidosService.findUpcoming(user.uid);
  }

  @Get(':id')
  findOne(@CurrentUser() user: FirebaseUser, @Param('id') id: string) {
    return this.partidosService.findOne(user.uid, id);
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
