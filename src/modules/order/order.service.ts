import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { runInTransaction } from '@utils/run-in-transaction';
import { Product } from '@entities/product';
import { Order } from '@entities/order';
import { OrderDTO } from './model/response/order.dto';
import { Cart } from '@entities/cart';
import { OrderItem } from '@entities/order-item';
import { OrderPaginationResponse } from './model/response/order-pagination';
import { OrderStatus } from '@enums/order-status';
import { CreateOrderPayment } from './model/request/create-order-payment';
import { PaymentStatus } from '@enums/payment-status';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Cart)
    private cartsRepository: Repository<Cart>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  toDTO(order: Order): OrderDTO {
    const orderDto = new OrderDTO();
    orderDto.id = order.id;
    orderDto.payment_status = order.payment_status;
    orderDto.order_status = order.order_status;
    orderDto.created_at = order.created_at;
    orderDto.updated_at = order.updated_at;
    orderDto.inactivated_at = order.inactivated_at;
    orderDto.is_active = order.is_active;
    orderDto.items =
      order.items?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        amount: item.amount,
        product_id: item.product.id,
      })) || [];
    orderDto.amount =
      order.items?.reduce((total, item) => total + item.amount, 0) || 0;
    return orderDto;
  }

  async createOrder(userId: string): Promise<OrderDTO> {
    return runInTransaction(this.dataSource, async (manager) => {
      const cart = await this.cartsRepository.findOne({
        where: { user: { id: userId } },
        relations: ['items', 'items.product', 'user'],
      });

      if (!cart) {
        throw new NotFoundException(
          'Nenhum carrinho em aberto para este usuário',
        );
      }
      if (!cart.items.length) {
        throw new BadRequestException('O carrinho não possui itens');
      }
      const createdOrder = manager.create(Order, {
        items: [],
        amount: 0,
        user: cart.user,
      });
      const savedOrder = await manager.save(Order, createdOrder);
      const errors: string[] = [];

      for (const item of cart.items) {
        const product = await this.productsRepository.findOne({
          where: { id: item.product.id },
        });
        if (!product || product.stock_quantity <= 0) {
          errors.push(
            `O produto ${product?.name ?? 'desconhecido'} está indisponível no momento`,
          );
        } else if (product.stock_quantity < item.quantity) {
          errors.push(
            `O produto ${product.name} não tem a quantidade solicitada. O máximo disponível neste momento são ${product.stock_quantity}`,
          );
        }
      }
      if (errors.length > 0) {
        throw new BadRequestException(errors);
      }

      for (const item of cart.items) {
        const product = await this.productsRepository.findOne({
          where: { id: item.product.id },
        });
        if (product) {
          const orderItem = manager.create(OrderItem, {
            order: savedOrder,
            quantity: item.quantity,
            price_per_unit: item.price_per_unit,
            amount: item.amount,
            product: product,
          });
          const savedOrderItem = await manager.save(OrderItem, orderItem);
          savedOrder.items.push(savedOrderItem);
          product.decreaseStock(item.quantity);
          await manager.save(Product, product);
        }
      }
      await manager.delete(Cart, { id: cart.id });
      return this.toDTO(savedOrder);
    });
  }

  async getOrders(
    userId: string,
    page: number,
    records: number,
  ): Promise<OrderPaginationResponse> {
    const skip: number = page ? (page - 1) * records : 0;
    const take: number = records ? records : 10;
    const orders = await this.ordersRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
      withDeleted: true,
      skip,
      take,
      relations: ['items', 'items.product'],
    });

    const totalCount = await this.ordersRepository.count({
      where: {
        user: {
          id: userId,
        },
      },
      withDeleted: true,
    });

    return new OrderPaginationResponse(
      orders.map((order) => this.toDTO(order)),
      page,
      records,
      totalCount,
      records * page >= totalCount,
    );
  }

  async findOneOrder(
    userId: string,
    id: string,
    withDeleted?: boolean,
  ): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: {
        id,
        user: {
          id: userId,
        },
      },
      withDeleted,
      relations: ['items', 'items.product'],
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    return order;
  }

  async getOrder(userId: string, id: string): Promise<OrderDTO> {
    const product = await this.findOneOrder(userId, id);
    return this.toDTO(product);
  }

  async cancelOrder(userId: string, id: string): Promise<OrderDTO> {
    return runInTransaction(this.dataSource, async (manager) => {
      const order = await this.findOneOrder(userId, id);
      for (const item of order.items) {
        const product = await this.productsRepository.findOne({
          where: { id: item.product.id },
        });
        if (product) {
          product.increaseStock(item.quantity);
          await manager.save(Product, product);
        }
      }

      order.order_status = OrderStatus.CANCELED;
      order.is_active = false;
      order.inactivated_at = new Date();
      const canceledOrder = await manager.save(Order, order);
      return this.toDTO(canceledOrder);
    });
  }

  async payOrder(
    userId: string,
    payment: CreateOrderPayment,
  ): Promise<OrderDTO> {
    const order = await this.ordersRepository.findOne({
      where: {
        id: payment.order_id,
        user: {
          id: userId,
        },
      },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    const paymentRNG = Math.floor(Math.random() * 2);
    if (paymentRNG) {
      order.order_status = OrderStatus.PROCESSING;
      order.payment_status = PaymentStatus.APPROVED;
    } else {
      order.payment_status = PaymentStatus.DENIED;
    }
    const savedOrder = await this.ordersRepository.save(order);
    if (savedOrder.payment_status === PaymentStatus.DENIED) {
      throw new UnprocessableEntityException(savedOrder);
    }
    return this.toDTO(savedOrder);
  }
}
