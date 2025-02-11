import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '@decorators/roles.decorator';
import { UserType } from '@enums/user-type';
import { RolesGuard } from '@guards/role.guard';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithUser } from '@interfaces/request-with-user';
import { CartDTO } from './response/cart.dto';
import { AddItemToCartDTO } from './request/add-item-to-cart.dto';
import { UpdateCartDTO } from './request/update-cart.dto';
import { CartService } from './cart.service';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @ApiResponse({ type: CartDTO })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.CLIENT, UserType.ADMIN)
  @Get()
  async getCart(@Res() res: Response, @Req() req: RequestWithUser) {
    const userId: string = req.user.sub;
    const cart: CartDTO = await this.cartService.getCart(userId);
    return res.status(HttpStatus.OK).send(cart);
  }

  @ApiResponse({ status: HttpStatus.OK })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  @Delete()
  async deleteCart(@Res() res: Response, @Req() req: RequestWithUser) {
    const userId: string = req.user.sub;
    await this.cartService.deleteCart(userId);
    return res.status(HttpStatus.OK).send('O carrinho foi limpo');
  }

  @ApiResponse({ type: CartDTO })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.CLIENT, UserType.ADMIN)
  @Post('items')
  async addItemToCart(
    @Body() createCart: AddItemToCartDTO,
    @Res() res: Response,
    @Req() req: RequestWithUser,
  ) {
    const userId: string = req.user.sub;
    const cart: CartDTO = await this.cartService.addItemToCart(
      userId,
      createCart.item,
    );
    return res.status(HttpStatus.CREATED).send(cart);
  }

  @ApiResponse({ type: CartDTO })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.CLIENT, UserType.ADMIN)
  @Patch('items')
  async updateCartItem(
    @Body() updateCart: UpdateCartDTO,
    @Res() res: Response,
    @Req() req: RequestWithUser,
  ) {
    const userId: string = req.user.sub;
    const updatedCart: CartDTO = await this.cartService.updateCartItem(
      userId,
      updateCart.item,
    );
    return res.status(HttpStatus.OK).send(updatedCart);
  }

  @ApiResponse({ status: HttpStatus.OK })
  @ApiParam({ name: 'id', type: 'uuid', description: 'ID do item' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserType.ADMIN)
  @Delete('items/:id')
  async removeItemFromCart(
    @Res() res: Response,
    @Req() req: RequestWithUser,
    @Param('id') productId: string,
  ) {
    const userId: string = req.user.sub;
    const updatedCart = await this.cartService.removeItemFromCart(
      userId,
      productId,
    );
    return res.status(HttpStatus.OK).send(updatedCart);
  }
}
