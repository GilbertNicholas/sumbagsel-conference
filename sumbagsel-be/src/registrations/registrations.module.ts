import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { Registration } from '../entities/registration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Registration])],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
