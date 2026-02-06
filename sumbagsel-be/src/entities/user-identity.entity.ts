import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

export enum Provider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

@Entity('user_identities')
@Unique(['provider', 'providerUserId'])
@Index(['userId'])
export class UserIdentity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 30 })
  provider: Provider;

  @Column({ type: 'varchar', length: 255, name: 'provider_user_id' })
  providerUserId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.identities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

