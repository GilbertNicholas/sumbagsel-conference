import { IsString, IsOptional, IsEnum, MaxLength, IsDateString } from 'class-validator';
import { TransportationType } from '../../entities/arrival-schedule.entity';

export class CreateArrivalScheduleDto {
  @IsEnum(TransportationType)
  @IsOptional()
  transportationType?: TransportationType;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  carrierName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  flightNumber?: string;

  @IsDateString()
  @IsOptional()
  arrivalDate?: string;

  @IsString()
  @IsOptional()
  arrivalTime?: string;
}
