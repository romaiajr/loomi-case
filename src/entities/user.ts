import {
  Entity,
  Column,
  Index,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { DefaultEntity } from './default-entity';
import { UserType } from 'src/enums/user-type';
import { Client } from './client';
import { Order } from './order';

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

  @Column({ default: false })
  is_active!: boolean;

  @OneToOne(() => Client, (client) => client.user, {
    cascade: true,
  })
  client?: Client;

  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];
}
