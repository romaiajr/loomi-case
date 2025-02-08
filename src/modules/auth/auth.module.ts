import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '@entities/user';
import { PasswordsService } from '../users/providers/password.service';
import { AuthCode } from '@entities/auth-code';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwtSecretKey'),
      }),
    }),
    TypeOrmModule.forFeature([User, AuthCode]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PasswordsService, ConfigService],
  exports: [AuthService],
})
export class AuthModule {}
