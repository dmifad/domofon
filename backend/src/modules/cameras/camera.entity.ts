import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Building } from '../buildings/building.entity';

@Entity({ name: 'cameras' })
export class Camera {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Building, { eager: true })
  @JoinColumn({ name: 'building_id' })
  building!: Building;

  @Column({ name: 'building_id' })
  buildingId!: string;

  @Column({ length: 120 })
  name!: string;

  /** Путь стрима в MediaMTX, например "building1-yard". */
  @Column({ name: 'stream_path', length: 120 })
  streamPath!: string;

  @Column({ name: 'has_archive', default: false })
  hasArchive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
