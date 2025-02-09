import { Entity, Column, OneToMany, DeleteDateColumn } from 'typeorm';
import { DefaultEntity } from './default-entity';
import { OrderItem } from './order-item';

@Entity('products')
export class Product extends DefaultEntity {
  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string;

  @Column()
  price!: number;

  @Column()
  stock_quantity!: number;

  @DeleteDateColumn({ nullable: true })
  inactivated_at!: Date;

  @Column({ default: true })
  is_active!: boolean;

  @OneToMany(() => OrderItem, (item) => item.product)
  items!: OrderItem[];
}
