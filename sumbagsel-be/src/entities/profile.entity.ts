import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('profiles')
@Unique(['userId'])
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 150, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 150, name: 'church_name' })
  churchName: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'contact_email' })
  contactEmail: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'phone_number' })
  phoneNumber: string | null;

  @Column({ type: 'text', nullable: true, name: 'photo_url' })
  photoUrl: string | null;

  @Column({ type: 'text', nullable: true, name: 'special_notes' })
  specialNotes: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_completed' })
  isCompleted: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.profile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

