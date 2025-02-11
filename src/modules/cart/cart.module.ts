import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Product } from '@entities/product';
import { CartItem } from '@entities/cart-item';
import { Cart } from '@entities/cart';
import { User } from '@entities/user';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product, Cart, CartItem]),
    AuthModule,
  ],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
