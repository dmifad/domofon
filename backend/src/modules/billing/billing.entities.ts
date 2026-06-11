import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'billing_accounts' })
export class BillingAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'apartment_id' })
  apartmentId!: string;

  @Index({ unique: true })
  @Column({ name: 'account_number', length: 32 })
  accountNumber!: string;

  /** Текущий баланс, ₽. Отрицательный — задолженность. */
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  balance!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity({ name: 'charges' })
export class Charge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'account_id' })
  accountId!: string;

  /** Расчётный период, формат YYYY-MM. */
  @Column({ length: 7 })
  period!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: string;

  @Column({ default: false })
  paid!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

export type PaymentStatus = 'pending' | 'succeeded' | 'canceled';

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'account_id' })
  accountId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: string;

  @Column({ length: 16, default: 'pending' })
  status!: PaymentStatus;

  /** ID платежа на стороне ЮKassa. */
  @Column({ name: 'provider_id', length: 64, nullable: true })
  providerId?: string;

  /** URL подтверждения оплаты (redirect на форму ЮKassa). */
  @Column({ name: 'confirmation_url', nullable: true })
  confirmationUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export type MeterType = 'cold_water' | 'hot_water' | 'electricity' | 'heating';

@Entity({ name: 'meter_readings' })
export class MeterReading {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'apartment_id' })
  apartmentId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'meter_type', length: 16 })
  meterType!: MeterType;

  @Column({ type: 'numeric', precision: 12, scale: 3 })
  value!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
