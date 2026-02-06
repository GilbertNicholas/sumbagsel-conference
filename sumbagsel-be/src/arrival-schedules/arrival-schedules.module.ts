import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArrivalSchedulesService } from './arrival-schedules.service';
import { ArrivalSchedulesController } from './arrival-schedules.controller';
import { ArrivalSchedule } from '../entities/arrival-schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArrivalSchedule])],
  controllers: [ArrivalSchedulesController],
  providers: [ArrivalSchedulesService],
  exports: [ArrivalSchedulesService],
})
export class ArrivalSchedulesModule {}
