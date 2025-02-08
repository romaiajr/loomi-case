import { User } from '@entities/user';
import { AuthService } from './auth.service';
import { AuthCode } from '@entities/auth-code';
import { Repository } from 'typeorm';
import { PasswordsService } from '../users/providers/password.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoginDTO } from './model/request/login.dto';
import { NotAcceptableException, UnauthorizedException } from '@nestjs/common';
import { VerifyCodeDTO } from './model/request/verify-code.dto';
import { JwtService } from '@nestjs/jwt';
import { UserType } from '@enums/user-type';

const mockPasswordService = {
  comparePasswords: jest.fn(),
};
const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
};
const mockAuthCodeRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
};

describe('UsersService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let authCodeRepository: Repository<AuthCode>;
  let passwordService: PasswordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: getRepositoryToken(AuthCode),
          useValue: mockAuthCodeRepository,
        },
        { provide: PasswordsService, useValue: mockPasswordService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userRepository = module.get(getRepositoryToken(User));
    authCodeRepository = module.get(getRepositoryToken(AuthCode));
    passwordService = module.get(PasswordsService);
  });

  describe('login', () => {
    it('Deve falhar caso o email e senha sejam inválidos', async () => {
      const existingClient = {
        id: '123',
        name: 'Cliente Teste',
        email: 'cliente@example.com',
        type: UserType.CLIENT,
        client: { contact: 'antigo', address: 'antigo' },
      } as User;

      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'password123',
      };

      userRepository.findOne = jest.fn().mockResolvedValue(existingClient);
      passwordService.comparePasswords = jest.fn().mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        NotAcceptableException,
      );
    });

    it('Deve gerar um código quando o email e senha forem válidos', async () => {
      const existingClient = {
        id: '123',
        name: 'Cliente Teste',
        email: 'cliente@example.com',
        type: UserType.CLIENT,
        client: { contact: 'antigo', address: 'antigo' },
      } as User;

      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'password123',
      };

      userRepository.findOne = jest.fn().mockResolvedValue(existingClient);
      passwordService.comparePasswords = jest.fn().mockResolvedValue(true);
      jest.spyOn(service as any, 'generateAuthCode').mockReturnValue('123456');

      const result = await service.login(loginDto);
      expect(result).toMatchObject({
        message:
          'Código de verificação enviado. Não me pergunte o código, já te disse 123456 vezes que não sei.',
      });
    });
  });

  describe('code', () => {
    it('Deve falhar caso o código tenha expirado ou seja inválido', async () => {
      const verifyCodeDto: VerifyCodeDTO = {
        email: 'test@example.com',
        code: '123456',
      };

      authCodeRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.verifyCode(verifyCodeDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('Deve gerar um JWT Token quando o email e code forem válidos', async () => {
      const verifyCodeDto: VerifyCodeDTO = {
        email: 'test@example.com',
        code: '123456',
      };

      authCodeRepository.findOne = jest.fn().mockResolvedValue(verifyCodeDto);

      await service.verifyCode(verifyCodeDto);
      expect(authCodeRepository.delete).toHaveBeenCalled();
      expect(jwtService.signAsync).toHaveBeenCalled();
    });
  });
});
