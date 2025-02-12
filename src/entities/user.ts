import {
  Entity,
  Column,
  Index,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { DefaultEntity } from './default-entity';
import { Customer } from './customer';
import { Order } from './order';
import { UserType } from '@enums/user-type';

@Entity('users')
export class User extends DefaultEntity {
  @Column()
  name!: string;

  @Index({ unique: true })
  @Column()
  email!: string;

  @Column()
  password!: string;

  @Column({ type: 'enum', enum: UserType })
  type!: UserType;

  @DeleteDateColumn({ nullable: true })
  inactivated_at!: Date;

  @Column({ default: true })
  is_active!: boolean;

  @OneToOne(() => Customer, (customer) => customer.user, {
    nullable: true,
    cascade: true,
  })
  customer?: Customer;

  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];
}
