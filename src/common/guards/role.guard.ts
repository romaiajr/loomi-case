import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '@decorators/public.decorator';
import { JwtPayload } from 'src/modules/auth/model/jwt-payload';
import { UserType } from '@enums/user-type';
import configuration from '@config/configuration';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    );
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new ForbiddenException('Token ausente');
    }

    try {
      const token = authHeader.split(' ')[1];

      const decoded: JwtPayload = this.jwtService.verify(token, {
        secret: configuration().jwtSecretKey,
      });
      const userType: UserType = decoded.type;

      if (!requiredRoles.includes(userType)) {
        throw new ForbiddenException(
          'Usuário sem permissão para acessar esta funcionalidade',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException(
          'Token expirado. Faça login novamente.',
        );
      }
      throw new UnauthorizedException('Token inválido');
    }
  }
}
