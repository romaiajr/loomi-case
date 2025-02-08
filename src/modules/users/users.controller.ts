import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './providers/users.service';
import { UserDTO } from './model/response/user.dto';
import { CreateUserDTO } from './model/request/create-user.dto';
import { Response } from 'express';
import { ClientDTO } from './model/response/client.dto';
import { UpdateUserDTO } from './model/request/update-user.dto';
import { UserPaginationResponse } from './model/response/user-pagination';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiResponse({ type: UserDTO || ClientDTO })
  @Post()
  async create(@Body() createUserData: CreateUserDTO, @Res() res: Response) {
    const user: UserDTO | ClientDTO =
      await this.usersService.create(createUserData);
    return res.status(HttpStatus.CREATED).send(user);
  }

  @ApiResponse({ type: UserPaginationResponse })
  @Get()
  async findAll(
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('records') records: number = 5,
  ) {
    const users: UserPaginationResponse = await this.usersService.findAll(
      page,
      records,
    );
    return res.status(HttpStatus.OK).send(users);
  }

  @ApiResponse({ type: UserDTO })
  @ApiParam({ name: 'id', type: 'uuid', description: 'ID do usuário' })
  @Get(':id')
  async findOne(
    @Res() res: Response,
    @Req() req: Request,
    @Param() params: { id: string },
  ) {
    const userId = params.id;
    const user: UserDTO | ClientDTO = await this.usersService.findOne(userId);
    return res.status(HttpStatus.OK).send(user);
  }

  @ApiResponse({ type: UserDTO })
  @ApiParam({ name: 'id', type: 'uuid', description: 'ID do usuário' })
  @Put(':id')
  async update(
    @Body() updateUserData: UpdateUserDTO,
    @Res() res: Response,
    @Req() req: Request,
    @Param() params: { id: string },
  ) {
    const userId: string = params.id;
    const updatedUser: UserDTO | ClientDTO = await this.usersService.update(
      userId,
      updateUserData,
    );
    return res.status(HttpStatus.OK).send(updatedUser);
  }

  @ApiResponse({ type: UserDTO })
  @ApiParam({ name: 'id', type: 'uuid', description: 'ID do usuário' })
  @Delete(':id')
  async remove(
    @Res() res: Response,
    @Req() req: Request,
    @Param() params: { id: string },
  ) {
    const userId = params.id;
    await this.usersService.remove(userId);
    return res.status(HttpStatus.OK).send('O usuário foi removido');
  }
}
