import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Apartment } from './apartment.entity';

export type ApartmentRole = 'owner' | 'member';

@Entity({ name: 'user_apartments' })
@Unique(['userId', 'apartmentId'])
export class UserApartment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => Apartment, { eager: true })
  @JoinColumn({ name: 'apartment_id' })
  apartment!: Apartment;

  @Column({ name: 'apartment_id' })
  apartmentId!: string;

  @Column({ length: 16, default: 'member' })
  role!: ApartmentRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
