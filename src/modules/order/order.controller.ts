import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '@decorators/roles.decorator';
import { UserType } from '@enums/user-type';
import { RolesGuard } from '@guards/role.guard';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithUser } from '@interfaces/request-with-user';
import { OrderDTO } from './model/response/order.dto';
import { OrderPaginationResponse } from './model/response/order-pagination';
import { OrderService } from './order.service';

@ApiTags('order')
@Controller('order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @ApiResponse({ type: OrderDTO })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.CLIENT, UserType.ADMIN)
  @Post()
  async createOrder(@Res() res: Response, @Req() req: RequestWithUser) {
    const userId: string = req.user.sub;
    const order: OrderDTO = await this.orderService.createOrder(userId);
    return res.status(HttpStatus.CREATED).send(order);
  }

  @ApiResponse({ type: OrderPaginationResponse })
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
  @Roles(UserType.CLIENT, UserType.ADMIN)
  @Get()
  async getOrders(
    @Res() res: Response,
    @Req() req: RequestWithUser,
    @Query('page') page: number = 1,
    @Query('records') records: number = 5,
  ) {
    const userId: string = req.user.sub;
    const orders: OrderPaginationResponse = await this.orderService.getOrders(
      userId,
      page,
      records,
    );
    return res.status(HttpStatus.OK).send(orders);
  }

  @ApiResponse({ type: OrderDTO })
  @ApiParam({ name: 'id', type: 'uuid', description: 'ID do Pedido' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.CLIENT, UserType.ADMIN)
  @Get(':id')
  async getOrder(
    @Res() res: Response,
    @Req() req: RequestWithUser,
    @Param('id') orderId: string,
  ) {
    const userId: string = req.user.sub;
    const order: OrderDTO = await this.orderService.getOrder(userId, orderId);
    return res.status(HttpStatus.OK).send(order);
  }

  @ApiResponse({ type: OrderDTO })
  @ApiParam({ name: 'id', type: 'uuid', description: 'ID do Pedido' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  @Delete(':id')
  async cancelOrder(
    @Res() res: Response,
    @Req() req: RequestWithUser,
    @Param('id') orderId: string,
  ) {
    const userId: string = req.user.sub;
    const canceledOrder = await this.orderService.cancelOrder(userId, orderId);
    return res.status(HttpStatus.OK).send(canceledOrder);
  }
}
