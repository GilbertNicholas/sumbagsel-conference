import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArrivalSchedule } from '../entities/arrival-schedule.entity';
import { CreateArrivalScheduleDto } from './dto/create-arrival-schedule.dto';
import { UpdateArrivalScheduleDto } from './dto/update-arrival-schedule.dto';
import { ArrivalScheduleResponseDto } from './dto/arrival-schedule-response.dto';

@Injectable()
export class ArrivalSchedulesService {
  constructor(
    @InjectRepository(ArrivalSchedule)
    private arrivalSchedulesRepository: Repository<ArrivalSchedule>,
  ) {}

  async findOneByUserId(userId: string): Promise<ArrivalScheduleResponseDto | null> {
    const arrivalSchedule = await this.arrivalSchedulesRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!arrivalSchedule) {
      return null;
    }

    return this.toResponseDto(arrivalSchedule);
  }

  async create(
    userId: string,
    createArrivalScheduleDto: CreateArrivalScheduleDto,
  ): Promise<ArrivalScheduleResponseDto> {
    // Check if arrival schedule already exists, if so update it
    const existingSchedule = await this.arrivalSchedulesRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (existingSchedule) {
      // Update existing schedule
      const arrivalDate = createArrivalScheduleDto.arrivalDate
        ? new Date(createArrivalScheduleDto.arrivalDate)
        : null;
      
      Object.assign(existingSchedule, {
        ...createArrivalScheduleDto,
        arrivalDate,
      });
      
      const updatedSchedule = await this.arrivalSchedulesRepository.save(existingSchedule);
      return this.toResponseDto(updatedSchedule);
    }

    // Convert arrivalDate string to Date if provided
    const arrivalDate = createArrivalScheduleDto.arrivalDate
      ? new Date(createArrivalScheduleDto.arrivalDate)
      : null;

    const arrivalSchedule = this.arrivalSchedulesRepository.create({
      userId,
      ...createArrivalScheduleDto,
      arrivalDate,
    });

    const savedArrivalSchedule = await this.arrivalSchedulesRepository.save(arrivalSchedule);

    return this.toResponseDto(savedArrivalSchedule);
  }

  async update(
    userId: string,
    updateArrivalScheduleDto: UpdateArrivalScheduleDto,
  ): Promise<ArrivalScheduleResponseDto> {
    const arrivalSchedule = await this.arrivalSchedulesRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!arrivalSchedule) {
      throw new NotFoundException('Arrival schedule not found');
    }

    // Convert arrivalDate string to Date if provided
    if (updateArrivalScheduleDto.arrivalDate !== undefined) {
      arrivalSchedule.arrivalDate = updateArrivalScheduleDto.arrivalDate
        ? new Date(updateArrivalScheduleDto.arrivalDate)
        : null;
    }

    // Update other fields
    if (updateArrivalScheduleDto.transportationType !== undefined) {
      arrivalSchedule.transportationType = updateArrivalScheduleDto.transportationType;
    }
    if (updateArrivalScheduleDto.carrierName !== undefined) {
      arrivalSchedule.carrierName = updateArrivalScheduleDto.carrierName;
    }
    if (updateArrivalScheduleDto.flightNumber !== undefined) {
      arrivalSchedule.flightNumber = updateArrivalScheduleDto.flightNumber;
    }
    if (updateArrivalScheduleDto.arrivalTime !== undefined) {
      arrivalSchedule.arrivalTime = updateArrivalScheduleDto.arrivalTime;
    }

    const updatedArrivalSchedule = await this.arrivalSchedulesRepository.save(arrivalSchedule);

    return this.toResponseDto(updatedArrivalSchedule);
  }

  private toResponseDto(arrivalSchedule: ArrivalSchedule): ArrivalScheduleResponseDto {
    return {
      id: arrivalSchedule.id,
      transportationType: arrivalSchedule.transportationType,
      carrierName: arrivalSchedule.carrierName,
      flightNumber: arrivalSchedule.flightNumber,
      arrivalDate: arrivalSchedule.arrivalDate,
      arrivalTime: arrivalSchedule.arrivalTime,
      createdAt: arrivalSchedule.createdAt,
      updatedAt: arrivalSchedule.updatedAt,
    };
  }
}
