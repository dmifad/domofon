import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export type DevicePlatform = 'android' | 'ios';

@Entity({ name: 'devices' })
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ length: 8 })
  platform!: DevicePlatform;

  /** FCM-токен (Android) или APNs-токен (iOS). */
  @Index({ unique: true })
  @Column({ name: 'push_token', length: 300 })
  pushToken!: string;

  /** PushKit VoIP-токен (только iOS). */
  @Column({ name: 'voip_token', length: 300, nullable: true })
  voipToken?: string;

  @Column({ name: 'app_version', length: 32, nullable: true })
  appVersion?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
