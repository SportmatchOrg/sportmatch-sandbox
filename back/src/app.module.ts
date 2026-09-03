import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { FirebaseModule } from './firebase/firebase.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PartidosModule } from './partidos/partidos.module';
import { DeportesModule } from './deportes/deportes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    FirebaseModule,
    UsersModule,
    PartidosModule,
    DeportesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
