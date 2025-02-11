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
import { Cart } from './cart';

@Entity('cart_items')
export class CartItem extends DefaultEntity {
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

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart!: Cart;
}
