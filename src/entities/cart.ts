import { Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { DefaultEntity } from './default-entity';
import { User } from './user';
import { CartItem } from './cart-item';

@Entity('carts')
export class Cart extends DefaultEntity {
  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, {
    nullable: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  items!: CartItem[];
}
