import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './providers/customers.service';
import { PasswordsService } from './providers/password.service';
import { UsersController } from './users.controller';
import { User } from '@entities/user';
import { Customer } from '@entities/customer';
import { AuthModule } from '../auth/auth.module';
import { AdminsController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Customer]), AuthModule],
  providers: [UsersService, PasswordsService],
  controllers: [UsersController, AdminsController],
  exports: [UsersService],
})
export class UsersModule {}
