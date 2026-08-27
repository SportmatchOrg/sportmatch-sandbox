import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  firebaseUid: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  nombre: string;

  @IsOptional()
  @IsUrl()
  fotoUrl?: string;
}
