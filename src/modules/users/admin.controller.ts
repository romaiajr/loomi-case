import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './providers/users.service';
import { UserDTO } from './model/response/user.dto';
import { Response } from 'express';
import { ClientDTO } from './model/response/client.dto';
import { UpdateUserDTO } from './model/request/update-user.dto';
import { UserPaginationResponse } from './model/response/user-pagination';
import { Roles } from '@decorators/roles.decorator';
import { UserType } from '@enums/user-type';
import { RolesGuard } from '@guards/role.guard';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('admins')
@Controller('admins')
export class AdminsController {
  constructor(private usersService: UsersService) {}

  @ApiResponse({ type: UserPaginationResponse })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (default: 1)',
  })
  @ApiQuery({
    name: 'records',
    required: false,
    type: Number,
    description: 'Quantidade de registros por página (default: 5)',
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  @Get(':id')
  async findOne(@Res() res: Response, @Param('id') userId: string) {
    const user: UserDTO | ClientDTO = await this.usersService.findOne(userId);
    return res.status(HttpStatus.OK).send(user);
  }

  @ApiResponse({ type: UserDTO })
  @ApiParam({ name: 'id', type: 'uuid', description: 'ID do usuário' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  @Put(':id')
  async update(
    @Body() updateUserData: UpdateUserDTO,
    @Res() res: Response,
    @Param('id') userId: string,
  ) {
    const updatedUser: UserDTO | ClientDTO = await this.usersService.update(
      userId,
      updateUserData,
    );
    return res.status(HttpStatus.OK).send(updatedUser);
  }

  @ApiResponse({ type: UserDTO })
  @ApiParam({ name: 'id', type: 'uuid', description: 'ID do usuário' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') userId: string) {
    await this.usersService.remove(userId);
    return res.status(HttpStatus.OK).send('O usuário foi removido');
  }
}
