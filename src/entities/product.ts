import { Entity, Column, OneToMany } from 'typeorm';
import { DefaultEntity } from './default-entity';
import { OrderItem } from './order-item';

@Entity('products')
export class Product extends DefaultEntity {
  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column()
  price!: number;

  @Column()
  stock_quantity!: number;

  @OneToMany(() => OrderItem, (item) => item.product)
  items!: OrderItem[];
}
