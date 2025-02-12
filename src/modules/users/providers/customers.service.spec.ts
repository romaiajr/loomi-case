import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './customers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '@entities/user';
import { Customer } from '@entities/customer';
import { Repository, DataSource } from 'typeorm';
import { PasswordsService } from './password.service';
import { CreateUserDTO } from '../model/request/create-user.dto';
import { UserType } from '@enums/user-type';
import { UserDTO } from '../model/response/user.dto';
import { CustomerDTO } from '../model/response/customer.dto';
import { UpdateUserDTO } from '../model/request/update-user.dto';
import { UserPaginationResponse } from '../model/response/user-pagination';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
};
const mockCustomerRepository = {
  save: jest.fn(),
};
const mockPasswordService = {
  hashPassword: jest.fn(),
};
const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
};
const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let customerRepository: Repository<Customer>;
  let passwordService: PasswordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        { provide: PasswordsService, useValue: mockPasswordService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    customerRepository = module.get(getRepositoryToken(Customer));
    passwordService = module.get(PasswordsService);
  });

  describe('create', () => {
    it('Deve criar um usuário comum', async () => {
      const userDto: CreateUserDTO = {
        name: 'Roberto Maia',
        email: 'test@example.com',
        password: 'password123',
        type: UserType.ADMIN,
      };

      passwordService.hashPassword = jest
        .fn()
        .mockResolvedValue('hashedPassword');
      mockQueryRunner.manager.create = jest
        .fn()
        .mockReturnValue(userDto as User);
      mockQueryRunner.manager.save = jest
        .fn()
        .mockResolvedValue({ ...userDto, id: '123' } as User);

      const result = await service.create(userDto);

      expect(passwordService.hashPassword).toHaveBeenCalledWith('password123');
      expect(result).toBeInstanceOf(UserDTO);
      expect(result).toEqual(
        expect.objectContaining({ id: '123', email: 'test@example.com' }),
      );
    });

    it('Deve criar um usuário CUSTOMER corretamente', async () => {
      const userDto: CreateUserDTO = {
        name: 'Customere Teste',
        email: 'customere@example.com',
        password: 'password123',
        type: UserType.CUSTOMER,
        contact: '(11) 99999-9999',
        address: 'Rua X, 123',
      };

      passwordService.hashPassword = jest
        .fn()
        .mockResolvedValue('hashedPassword');
      mockQueryRunner.manager.create = jest
        .fn()
        .mockReturnValue(userDto as User);
      mockQueryRunner.manager.save = jest
        .fn()
        .mockResolvedValue({ ...userDto, id: '456' } as User);

      customerRepository.save = jest.fn().mockResolvedValue({
        id: '789',
        contact: userDto.contact,
        address: userDto.address,
        user: { id: '456' },
      } as Customer);

      const result = await service.create(userDto);

      expect(result).toBeInstanceOf(CustomerDTO);
      expect(result).toEqual(
        expect.objectContaining({ id: '456', contact: userDto.contact }),
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(2);
    });

    it('Deve falhar ao criar usuário com email duplicado', async () => {
      const userDto: CreateUserDTO = {
        name: 'Roberto Maia',
        email: 'test@example.com',
        password: 'password123',
        type: UserType.ADMIN,
      };

      userRepository.findOne = jest
        .fn()
        .mockResolvedValue({ ...userDto, id: '456' });

      await expect(service.create(userDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('Deve atualizar um usuário comum', async () => {
      const updateDto: UpdateUserDTO = {
        name: 'Novo Nome',
        email: 'test@example.com',
      };
      const existingUser = {
        id: '123',
        name: 'Roberto',
        email: 'test@example.com',
        type: UserType.ADMIN,
      } as User;

      userRepository.findOne = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValue(existingUser);
      mockQueryRunner.manager.save = jest
        .fn()
        .mockResolvedValue({ ...existingUser, ...updateDto });

      const result = await service.update('123', updateDto);

      expect(result).toBeInstanceOf(UserDTO);
      expect(result.name).toBe(updateDto.name);
      expect(result.email).toBe(existingUser.email);
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    });

    it('Deve atualizar um customere', async () => {
      const updateDto: UpdateUserDTO = {
        name: 'Customere Teste',
        email: 'customere@example.com',
        contact: '(11) 99999-9999',
        address: 'Rua Y, 123',
      };
      const existingCustomer = {
        id: '123',
        name: 'Customere Teste',
        email: 'customere@example.com',
        type: UserType.CUSTOMER,
        customer: { contact: 'antigo', address: 'antigo' },
      } as User;

      userRepository.findOne = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValue(existingCustomer);
      mockQueryRunner.manager.save = jest
        .fn()
        .mockResolvedValue({ ...existingCustomer.customer, ...updateDto });

      const result: CustomerDTO = (await service.update(
        '123',
        updateDto,
      )) as CustomerDTO;

      expect(result).toBeInstanceOf(CustomerDTO);
      expect(result.contact).toBe(updateDto.contact);
      expect(result.address).toBe(updateDto.address);
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    });

    it('Deve falhar ao atualizar um usuário caso o email seja duplicado', async () => {
      const userDto: CreateUserDTO = {
        name: 'Roberto Maia',
        email: 'test@example.com',
        password: 'password123',
        type: UserType.ADMIN,
      };

      userRepository.findOne = jest
        .fn()
        .mockResolvedValue({ ...userDto, id: '456' });

      await expect(service.create(userDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar usuários paginados com customers e admins separados', async () => {
      const page = 1;
      const records = 2;

      const users = [
        {
          id: '1',
          name: 'Admin 1',
          email: 'admin1@example.com',
          type: UserType.ADMIN,
          customer: null,
        },
        {
          id: '2',
          name: 'Customere 1',
          email: 'customere1@example.com',
          type: UserType.CUSTOMER,
          customer: { contact: '12345', address: 'Rua A' },
        },
        {
          id: '3',
          name: 'Admin 2',
          email: 'admin2@example.com',
          type: UserType.ADMIN,
          customer: null,
        },
        {
          id: '4',
          name: 'Customere 2',
          email: 'customere2@example.com',
          type: UserType.CUSTOMER,
          customer: { contact: '67890', address: 'Rua B' },
        },
      ];

      userRepository.find = jest
        .fn()
        .mockResolvedValue(users.slice(0, records));
      userRepository.count = jest.fn().mockResolvedValue(users.length);

      const result = await service.findAll(page, records);

      expect(result.items.customers).toHaveLength(1);
      expect(result.items.admins).toHaveLength(1);
      expect(result.total).toBe(users.length);
      expect(result.page).toBe(page);
      expect(result.records).toBe(records);
      expect(result.lastElement).toBe(false);
      expect(result).toBeInstanceOf(UserPaginationResponse);
    });

    it('deve retornar `lastElement: true` na última página', async () => {
      const page = 2;
      const records = 2;

      const users = [
        {
          id: '1',
          name: 'Admin 1',
          email: 'admin1@example.com',
          type: UserType.ADMIN,
          customer: null,
        },
        {
          id: '2',
          name: 'Customere 1',
          email: 'customere1@example.com',
          type: UserType.CUSTOMER,
          customer: { contact: '12345', address: 'Rua A' },
        },
        {
          id: '3',
          name: 'Admin 2',
          email: 'admin2@example.com',
          type: UserType.ADMIN,
          customer: null,
        },
        {
          id: '4',
          name: 'Customere 2',
          email: 'customere2@example.com',
          type: UserType.CUSTOMER,
          customer: { contact: '67890', address: 'Rua B' },
        },
      ];

      userRepository.find = jest.fn().mockResolvedValue(users.slice(2, 4));
      userRepository.count = jest.fn().mockResolvedValue(users.length);

      const result = await service.findAll(page, records);

      expect(result.lastElement).toBe(true);
    });

    it('deve retornar um array vazio se não houver usuários na página', async () => {
      userRepository.find = jest.fn().mockResolvedValue([]);
      userRepository.count = jest.fn().mockResolvedValue(0);

      const result = await service.findAll(1, 10);

      expect(result.items.customers).toHaveLength(0);
      expect(result.items.admins).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.lastElement).toBe(true);
    });
  });

  describe('findOne', () => {
    it('deve retornar um usuário pelo ID', async () => {
      const user = {
        id: '123',
        name: 'Teste',
        email: 'teste@example.com',
        type: UserType.ADMIN,
      };
      userRepository.findOne = jest.fn().mockResolvedValue(user);

      const result = await service.findOne('123');

      expect(result).toBeInstanceOf(UserDTO);
      expect(result.id).toBe('123');
    });

    it('deve lançar erro ao buscar um usuário inexistente', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve inativar um usuário', async () => {
      const user = {
        id: '123',
        name: 'Teste',
        email: 'teste@example.com',
        type: UserType.ADMIN,
      };
      userRepository.findOne = jest.fn().mockResolvedValue(user);
      userRepository.update = jest.fn().mockResolvedValue(undefined);

      await service.remove('123');

      expect(userRepository.update).toHaveBeenCalledWith(
        '123',
        expect.any(Object),
      );
    });
  });
});
