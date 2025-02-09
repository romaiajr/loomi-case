import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './providers/users.service';
import { UserDTO } from './model/response/user.dto';
import { CreateUserDTO } from './model/request/create-user.dto';
import { Response } from 'express';
import { ClientDTO } from './model/response/client.dto';
import { UpdateUserDTO } from './model/request/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '@decorators/public.decorator';
import { RequestWithUser } from '@interfaces/request-with-user';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiResponse({ type: UserDTO || ClientDTO })
  @Public()
  @Post()
  async create(@Body() createUserData: CreateUserDTO, @Res() res: Response) {
    const user: UserDTO | ClientDTO =
      await this.usersService.create(createUserData);
    return res.status(HttpStatus.CREATED).send(user);
  }

  @ApiResponse({ type: UserDTO })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async find(@Res() res: Response, @Req() req: RequestWithUser) {
    const userId: string = req.user.sub;
    const user: UserDTO | ClientDTO = await this.usersService.findOne(userId);
    return res.status(HttpStatus.OK).send(user);
  }

  @ApiResponse({ type: UserDTO })
  @UseGuards(AuthGuard('jwt'))
  @Put()
  async update(
    @Body() updateUserData: UpdateUserDTO,
    @Res() res: Response,
    @Req() req: RequestWithUser,
  ) {
    const userId: string = req.user.sub;
    const updatedUser: UserDTO | ClientDTO = await this.usersService.update(
      userId,
      updateUserData,
    );
    return res.status(HttpStatus.OK).send(updatedUser);
  }

  @ApiResponse({ type: UserDTO })
  @UseGuards(AuthGuard('jwt'))
  @Delete()
  async remove(@Res() res: Response, @Req() req: RequestWithUser) {
    const userId: string = req.user.sub;
    await this.usersService.remove(userId);
    return res.status(HttpStatus.OK).send('O usuário foi removido');
  }
}
