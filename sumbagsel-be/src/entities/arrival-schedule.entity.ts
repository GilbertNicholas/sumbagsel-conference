import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum TransportationType {
  LAUT = 'laut',
  UDARA = 'udara',
}

@Entity('arrival_schedules')
export class ArrivalSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'transportation_type',
  })
  transportationType: TransportationType | null;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'carrier_name' })
  carrierName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'flight_number' })
  flightNumber: string | null;

  @Column({ type: 'date', nullable: true, name: 'arrival_date' })
  arrivalDate: Date | null;

  @Column({ type: 'time', nullable: true, name: 'arrival_time' })
  arrivalTime: string | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.arrivalSchedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
