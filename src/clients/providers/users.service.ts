import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from 'src/entities/client';
import { User } from 'src/entities/user';
import { DataSource, Repository } from 'typeorm';
import { PasswordsService } from './password.service';
import { CreateUserDTO } from '../model/request/create-user.dto';
import { UserDTO } from '../model/response/user.dto';
import { UserType } from 'src/enums/user-type';
import { ClientDTO } from '../model/response/client.dto';
import { EmailConflictError } from '../error/email-conflict';
import { UserNotFoundError } from '../error/user-not-found';
import { UpdateUserDTO } from '../model/request/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    private readonly passwordService: PasswordsService,
    private dataSource: DataSource,
  ) {}

  toDTO(user: User): UserDTO | ClientDTO {
    const userDto = new UserDTO();
    userDto.id = user.id;
    userDto.name = user.name;
    userDto.email = user.email;
    userDto.type = user.type;

    if (user.client) {
      const clientDto = new ClientDTO();
      Object.assign(clientDto, userDto);
      clientDto.contact = user.client.contact;
      clientDto.address = user.client.address;
      return clientDto;
    }

    return userDto;
  }

  async validateEmail(email: string) {
    if (
      await this.usersRepository.findOne({
        where: { email },
        cache: false,
      })
    ) {
      throw new EmailConflictError();
    }
  }

  async create(user: CreateUserDTO): Promise<UserDTO | ClientDTO> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.validateEmail(user.email);
      user.password = await this.passwordService.hashPassword(user.password);
      const createdUser = queryRunner.manager.create(User, user);
      const savedUser = await queryRunner.manager.save(User, createdUser);
      if (user.type === UserType.CLIENT) {
        const clientData: { address?: string; contact?: string } = {
          address: user.address,
          contact: user.contact,
        };
        const createdClient = queryRunner.manager.create(Client, {
          user: createdUser,
          ...clientData,
        });
        const savedClient = await queryRunner.manager.save(
          Client,
          createdClient,
        );
        savedUser.client = savedClient;
      }

      await queryRunner.commitTransaction();
      return this.toDTO(savedUser);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<{
    clients: ClientDTO[];
    admins: UserDTO[];
  }> {
    const users = await this.usersRepository.find({ relations: ['client'] });
    const clients: ClientDTO[] = [];
    const admins: UserDTO[] = [];

    users.forEach((user) => {
      if (user.client) {
        clients.push(this.toDTO(user) as ClientDTO);
      } else admins.push(this.toDTO(user) as UserDTO);
    });
    return {
      clients,
      admins,
    };
  }

  async findOneUser(id: string, where?: object): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, ...where },
      relations: ['client'],
    });
    if (!user) {
      throw new UserNotFoundError();
    }
    return user;
  }

  async findOne(id: string): Promise<UserDTO | ClientDTO> {
    const user = await this.findOneUser(id);
    return this.toDTO(user);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    const currentDate = new Date().toISOString();
    await this.usersRepository.update(id, {
      is_active: false,
      inactivated_at: currentDate,
    });
  }

  async update(
    userId: string,
    updateData: UpdateUserDTO,
  ): Promise<UserDTO | ClientDTO> {
    await this.validateEmail(updateData.email);
    const user = await this.findOneUser(userId);
    Object.assign(user, updateData);
    if (user.client && ('contact' in updateData || 'address' in updateData)) {
      Object.assign(user.client, updateData);
      await this.clientsRepository.save(user.client);
    }
    await this.usersRepository.save(user);
    return this.toDTO(user);
  }
}
