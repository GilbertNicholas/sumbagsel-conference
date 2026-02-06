import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

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

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.registration, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
