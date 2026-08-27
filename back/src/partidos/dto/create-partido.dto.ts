import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Nivel } from '../../generated/prisma/client';

export class CreatePartidoDto {
  @IsString()
  @IsNotEmpty()
  deporteId: string;

  @IsEnum(Nivel)
  nivel: Nivel;

  @Type(() => Date)
  @IsDate()
  fecha: Date;

  @IsString()
  @Length(3, 120)
  ubicacion: string;

  @IsInt()
  @Min(2)
  @Max(30)
  cupo: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  descripcion?: string;
}
