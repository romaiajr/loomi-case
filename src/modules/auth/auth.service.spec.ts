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
import { ConfigService } from '@nestjs/config';

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
  signAsync: jest.fn().mockResolvedValue('mockedJwtToken'),
};

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let userRepository: Repository<User>;
  let authCodeRepository: Repository<AuthCode>;
  let passwordService: PasswordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'JWT_SECRET') return 'testSecret'; // ✅ Correção do nome da chave
              return null;
            }),
          },
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(AuthCode),
          useValue: mockAuthCodeRepository,
        },
        { provide: PasswordsService, useValue: mockPasswordService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    userRepository = module.get(getRepositoryToken(User));
    authCodeRepository = module.get(getRepositoryToken(AuthCode));
    passwordService = module.get(PasswordsService);
  });

  describe('login', () => {
    it('Deve falhar caso o email e senha sejam inválidos', async () => {
      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockPasswordService.comparePasswords.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        NotAcceptableException,
      );
    });

    it('Deve gerar um código quando o email e senha forem válidos', async () => {
      const existingCustomer = {
        id: '123',
        name: 'Customere Teste',
        email: 'customere@example.com',
        type: UserType.CUSTOMER,
        customer: { contact: 'antigo', address: 'antigo' },
      } as User;

      const loginDto: LoginDTO = {
        email: 'customere@example.com',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(existingCustomer);
      mockPasswordService.comparePasswords.mockResolvedValue(true);
      jest.spyOn(service as any, 'generateAuthCode').mockReturnValue('123456');

      const result = await service.login(loginDto);

      expect(result).toMatchObject({
        message: expect.stringContaining('123456 vezes que não sei.'),
      });

      expect(mockAuthCodeRepository.save).toHaveBeenCalledWith({
        email: loginDto.email,
        code: '123456',
      });
    });
  });

  describe('verifyCode', () => {
    it('Deve falhar caso o código tenha expirado ou seja inválido', async () => {
      const verifyCodeDto: VerifyCodeDTO = {
        email: 'test@example.com',
        code: '123456',
      };

      mockAuthCodeRepository.findOne.mockResolvedValue(null);

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
