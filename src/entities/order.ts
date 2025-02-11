import { Entity, Column, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { DefaultEntity } from './default-entity';
import { OrderStatus } from '@enums/order-status';
import { User } from './user';
import { OrderItem } from './order-item';
import { PaymentStatus } from '@enums/payment-status';

@Entity('orders')
export class Order extends DefaultEntity {
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.RECEIVED })
  order_status!: OrderStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  payment_status!: PaymentStatus;

  @Column()
  amount!: number;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => OrderItem, (item) => item.order)
  items!: OrderItem[];
}
