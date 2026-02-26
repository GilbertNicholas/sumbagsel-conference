import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { RegistrationChild } from './registration-child.entity';

export enum RegistrationStatus {
  BELUM_TERDAFTAR = 'Belum terdaftar',
  PENDING = 'Pending',
  TERDAFTAR = 'Terdaftar',
  DAFTAR_ULANG = 'Daftar ulang',
}

@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true, name: 'user_id' })
  userId: string;

  @Column({ type: 'text', nullable: true, name: 'payment_proof_url' })
  paymentProofUrl: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: RegistrationStatus.BELUM_TERDAFTAR,
  })
  status: RegistrationStatus;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'unique_code' })
  uniqueCode: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'total_amount' })
  totalAmount: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'base_amount' })
  baseAmount: number | null;

  @Column({ type: 'datetime', nullable: true, name: 'checked_in_at' })
  checkedInAt: Date | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.registration, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => RegistrationChild, (child) => child.registration)
  children: RegistrationChild[];
}
