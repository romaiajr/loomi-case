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
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JwtSecretKey'),
        signOptions: { expiresIn: '4h' },
      }),
    }),
    TypeOrmModule.forFeature([User, AuthCode]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PasswordsService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
