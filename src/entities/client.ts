import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { DefaultEntity } from './default-entity';
import { User } from './user';

@Entity('clients')
export class Client extends DefaultEntity {
  @Column()
  contact!: string;

  @Column()
  address!: string;

  @OneToOne(() => User, (user) => user.client, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
