import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CallStatus =
  | 'ringing'
  | 'answered'
  | 'declined'
  | 'missed'
  | 'ended';

@Entity({ name: 'calls' })
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'intercom_id' })
  intercomId!: string;

  @Index()
  @Column({ name: 'apartment_id', nullable: true })
  apartmentId?: string;

  @Index()
  @Column({ name: 'building_id' })
  buildingId!: string;

  @Column({ length: 16, default: 'ringing' })
  status!: CallStatus;

  /** Идентификатор канала Asterisk (для отбоя/событий). */
  @Column({ name: 'channel_id', length: 100, nullable: true })
  channelId?: string;

  /** SIP-URI, на который мобильный клиент должен ответить. */
  @Column({ name: 'sip_uri', length: 200, nullable: true })
  sipUri?: string;

  /** Кто ответил (user.id). */
  @Column({ name: 'answered_by', nullable: true })
  answeredBy?: string;

  /** Кадр с панели в момент звонка. */
  @Column({ name: 'snapshot_url', nullable: true })
  snapshotUrl?: string;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'answered_at', type: 'timestamptz', nullable: true })
  answeredAt?: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
