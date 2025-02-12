import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from '@entities/customer';
import { User } from '@entities/user';
import { DataSource, Not, Repository } from 'typeorm';
import { PasswordsService } from './password.service';
import { CreateUserDTO } from '../model/request/create-user.dto';
import { UserDTO } from '../model/response/user.dto';
import { UserType } from '@enums/user-type';
import { CustomerDTO } from '../model/response/customer.dto';
import { UpdateUserDTO } from '../model/request/update-user.dto';
import { runInTransaction } from '@utils/run-in-transaction';
import { UserPaginationResponse } from '../model/response/user-pagination';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly passwordService: PasswordsService,
    private dataSource: DataSource,
  ) {}

  toDTO(user: User): UserDTO | CustomerDTO {
    const userDto = new UserDTO();
    userDto.id = user.id;
    userDto.name = user.name;
    userDto.email = user.email;
    userDto.type = user.type;

    if (user.customer) {
      const customerDto = new CustomerDTO();
      Object.assign(customerDto, userDto);
      customerDto.contact = user.customer.contact;
      customerDto.address = user.customer.address;
      return customerDto;
    }

    return userDto;
  }

  async validateEmail(email: string, id?: string) {
    const where = id ? { id: Not(id), email } : { email };

    const existentUser = await this.usersRepository.findOne({
      withDeleted: true,
      where,
      cache: false,
    });

    if (existentUser) {
      throw new BadRequestException('Email já cadastrado');
    }
  }

  async create(user: CreateUserDTO): Promise<UserDTO | CustomerDTO> {
    return runInTransaction(this.dataSource, async (manager) => {
      await this.validateEmail(user.email);
      user.password = await this.passwordService.hashPassword(user.password);
      const createdUser = manager.create(User, user);
      const savedUser = await manager.save(User, createdUser);
      if (user.type === UserType.CUSTOMER) {
        const customerData: { address?: string; contact?: string } = {
          address: user.address,
          contact: user.contact,
        };
        const createdCustomer = manager.create(Customer, {
          user: createdUser,
          ...customerData,
        });
        const savedCustomer = await manager.save(Customer, createdCustomer);
        savedUser.customer = savedCustomer;
      }
      return this.toDTO(savedUser);
    });
  }

  async findAll(
    page: number,
    records: number,
  ): Promise<UserPaginationResponse> {
    const skip: number = page ? (page - 1) * records : 0;
    const take: number = records ? records : 10;
    const users = await this.usersRepository.find({
      relations: ['customer'],
      skip,
      take,
    });
    const customers: CustomerDTO[] = [];
    const admins: UserDTO[] = [];

    users.forEach((user) => {
      if (user.customer) {
        customers.push(this.toDTO(user) as CustomerDTO);
      } else admins.push(this.toDTO(user) as UserDTO);
    });
    const totalCount = await this.usersRepository.count();

    return new UserPaginationResponse(
      { customers, admins },
      page,
      records,
      totalCount,
      records * page >= totalCount,
    );
  }

  async findOneUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['customer'],
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findOne(id: string): Promise<UserDTO | CustomerDTO> {
    const user = await this.findOneUser(id);
    return this.toDTO(user);
  }

  async remove(id: string): Promise<void> {
    await this.findOneUser(id);
    const currentDate = new Date().toISOString();
    await this.usersRepository.update(id, {
      is_active: false,
      inactivated_at: currentDate,
    });
  }

  async update(
    userId: string,
    updateData: UpdateUserDTO,
  ): Promise<UserDTO | CustomerDTO> {
    return runInTransaction(this.dataSource, async (manager) => {
      await this.validateEmail(updateData.email, userId);
      const user = await this.findOneUser(userId);
      Object.assign(user, updateData);
      if (
        user.customer &&
        ('contact' in updateData || 'address' in updateData)
      ) {
        Object.assign(user.customer, updateData);
        await manager.save(Customer, user.customer);
      }
      await manager.save(User, user);
      return this.toDTO(user);
    });
  }
}
