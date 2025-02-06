import { Entity, Column } from 'typeorm';
import { DefaultEntity } from './default-entity';

@Entity('reports')
export class Report extends DefaultEntity {
  @Column()
  name!: string;

  @Column()
  start_date!: Date;

  @Column()
  end_state!: Date;

  @Column()
  amount: number;

  @Column()
  sold_items: number;

  @Column()
  file_path!: string;
}
