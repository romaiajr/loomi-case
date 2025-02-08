import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './providers/users.service';
import { PasswordsService } from './providers/password.service';
import { UsersController } from './users.controller';
import { User } from '@entities/user';
import { Client } from '@entities/client';

@Module({
  imports: [TypeOrmModule.forFeature([User, Client])],
  providers: [UsersService, PasswordsService],
  controllers: [UsersController],
})
export class UsersModule {}
