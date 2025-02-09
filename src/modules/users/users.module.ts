import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './providers/users.service';
import { PasswordsService } from './providers/password.service';
import { UsersController } from './users.controller';
import { User } from '@entities/user';
import { Client } from '@entities/client';
import { AuthModule } from '../auth/auth.module';
import { AdminsController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Client]), AuthModule],
  providers: [UsersService, PasswordsService],
  controllers: [UsersController, AdminsController],
  exports: [UsersService],
})
export class UsersModule {}
