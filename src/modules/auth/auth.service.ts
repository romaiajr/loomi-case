import { User } from '@entities/user';
import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordsService } from '../users/providers/password.service';
import { JwtToken } from './model/response/jwt-token';
import { AuthCode } from '@entities/auth-code';
import { LoginDTO } from './model/request/login.dto';
import { VerifyCodeDTO } from './model/request/verify-code.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuthCode)
    private readonly authCodeRepository: Repository<AuthCode>,
    private readonly passwordService: PasswordsService,
  ) {}

  private generateAuthCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Código de 6 dígitos
  }

  async login(auth: LoginDTO): Promise<{ message: string }> {
    const { email, password } = auth;
    const user = await this.userRepository.findOne({
      where: { email: email },
    });

    if (!user) {
      throw new NotAcceptableException('Credenciais inválidas.');
    }

    const passwordMatch = await this.passwordService.comparePasswords(
      password,
      user.password,
    );

    if (!passwordMatch) {
      throw new NotAcceptableException('Credenciais inválidas.');
    }

    const code = this.generateAuthCode();
    await this.authCodeRepository.save({ email: email, code });
    // O ideal seria utilizar um sistema de envio de e-mails, mas neste caso optei por simular a validação apenas.
    return {
      message: `Código de verificação enviado. Não me pergunte o código, já te disse ${code} vezes que não sei.`,
    };
  }

  async verifyCode(auth: VerifyCodeDTO): Promise<JwtToken> {
    const { email, code } = auth;
    const authCode = await this.authCodeRepository.findOne({
      where: { email, code },
    });

    if (!authCode) {
      throw new UnauthorizedException('Código inválido ou expirado.');
    }

    await this.authCodeRepository.delete({ email });

    const user: User | null = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Credenciais inválidas.');
    }

    const payload = { username: user.email, sub: user.id, type: user.type };
    const jwt: JwtToken = {
      access_token: await this.jwtService.signAsync(payload),
    };
    return jwt;
  }
}
