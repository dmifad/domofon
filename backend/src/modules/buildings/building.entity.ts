import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'buildings' })
export class Building {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  city!: string;

  @Column({ length: 300 })
  address!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
