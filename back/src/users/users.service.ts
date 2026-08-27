import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';
import { FirebaseUser } from '../auth/types';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findAll() {
    return this.usersRepository.findAll();
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} was not found`);
    }

    return user;
  }

  async findByFirebaseUid(firebaseUid: string) {
    const user = await this.usersRepository.findByFirebaseUid(firebaseUid);

    if (!user) {
      throw new NotFoundException(
        `User with firebaseUid ${firebaseUid} was not found`,
      );
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findByFirebaseUid(
      createUserDto.firebaseUid,
    );

    if (existingUser) {
      return existingUser;
    }

    try {
      return await this.usersRepository.create(createUserDto);
    } catch (error) {
      throw this.toHttpException(error, createUserDto.email);
    }
  }

  upsertFromFirebase(user: FirebaseUser) {
    return this.usersRepository.upsertByFirebaseUid(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      return await this.usersRepository.update(id, updateUserDto);
    } catch (error) {
      throw this.toHttpException(error, id);
    }
  }

  async remove(id: string) {
    try {
      return await this.usersRepository.remove(id);
    } catch (error) {
      throw this.toHttpException(error, id);
    }
  }

  private toHttpException(error: unknown, reference: string): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: unique constraint violation (duplicated email or firebaseUid)
      if (error.code === 'P2002') {
        return new ConflictException(
          'A user with that email or firebaseUid already exists',
        );
      }

      // P2025: the record to update or delete does not exist
      if (error.code === 'P2025') {
        return new NotFoundException(`User with id ${reference} was not found`);
      }
    }

    return error instanceof Error ? error : new Error(String(error));
  }
}
