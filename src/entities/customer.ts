import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { DefaultEntity } from './default-entity';
import { User } from './user';

@Entity('customers')
export class Customer extends DefaultEntity {
  @Column()
  contact!: string;

  @Column()
  address!: string;

  @OneToOne(() => User, (user) => user.customer, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
