import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Building } from '../buildings/building.entity';

@Entity({ name: 'intercoms' })
export class Intercom {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Building, { eager: true })
  @JoinColumn({ name: 'building_id' })
  building!: Building;

  @Column({ name: 'building_id' })
  buildingId!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ name: 'sip_uri', length: 200, nullable: true })
  sipUri?: string;

  /** HTTP API панели для открытия двери (если поддерживается). */
  @Column({ name: 'open_url', length: 300, nullable: true })
  openUrl?: string;

  /** Путь стрима камеры панели в MediaMTX. */
  @Column({ name: 'camera_path', length: 120, nullable: true })
  cameraPath?: string;

  @Column({ length: 16, default: 'online' })
  status!: 'online' | 'offline';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
