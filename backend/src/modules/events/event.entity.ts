import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type EventType =
  | 'call.answered'
  | 'call.missed'
  | 'door.opened.app'
  | 'door.opened.key'
  | 'door.opened.code'
  | 'system';

@Entity({ name: 'events' })
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'apartment_id', nullable: true })
  apartmentId?: string;

  @Index()
  @Column({ name: 'building_id', nullable: true })
  buildingId?: string;

  @Column({ length: 32 })
  type!: EventType;

  @Column({ type: 'jsonb', default: {} })
  payload!: Record<string, unknown>;

  @Column({ name: 'snapshot_url', nullable: true })
  snapshotUrl?: string;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
