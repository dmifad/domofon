import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Building } from '../buildings/building.entity';

@Entity({ name: 'apartments' })
export class Apartment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Building, { eager: true })
  @JoinColumn({ name: 'building_id' })
  building!: Building;

  @Column({ name: 'building_id' })
  buildingId!: string;

  @Column({ length: 16 })
  number!: string;

  @Index({ unique: true })
  @Column({ name: 'account_number', length: 32 })
  accountNumber!: string;

  /** Код подтверждения, выдаваемый УК для привязки квартиры. */
  @Column({ name: 'link_code', length: 16 })
  linkCode!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
