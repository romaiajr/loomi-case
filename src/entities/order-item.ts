import {
  Entity,
  Column,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DefaultEntity } from './default-entity';
import { Product } from './product';
import { Order } from './order';

@Entity('order_items')
export class OrderItem extends DefaultEntity {
  @Column()
  quantity!: number;

  @Column()
  price_per_unit!: number;

  @Column()
  amount!: number;

  @BeforeInsert()
  @BeforeUpdate()
  calculateAmount() {
    this.amount = this.quantity * this.price_per_unit;
  }

  @ManyToOne(() => Product, (product) => product.items)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order!: Order;
}
