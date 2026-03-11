import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Registration } from './registration.entity';

@Entity('registration_children')
export class RegistrationChild {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'registration_id' })
  registrationId: string;

  @Column({ type: 'varchar', length: 150, name: 'name' })
  name: string;

  @Column({ type: 'int', name: 'age' })
  age: number;

  @Column({ type: 'datetime', nullable: true, name: 'checked_in_at' })
  checkedInAt: Date | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Registration, (reg) => reg.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'registration_id' })
  registration: Registration;
}
