import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Product } from '@entities/product';
import { CartItem } from '@entities/cart-item';
import { Cart } from '@entities/cart';
import { OrderItem } from '@entities/order-item';
import { Order } from '@entities/order';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Cart, CartItem, Order, OrderItem]),
    AuthModule,
  ],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
