import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'code' })
  code: string;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'name' })
  name: string | null;

  /** master = bisa menyetujui/menolak pendaftaran; biasa = tidak bisa */
  @Column({ type: 'varchar', length: 20, default: 'biasa', name: 'role' })
  role: 'master' | 'biasa';

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}
