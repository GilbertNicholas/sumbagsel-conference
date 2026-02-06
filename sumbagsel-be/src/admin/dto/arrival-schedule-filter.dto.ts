import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { TransportationType } from '../../entities/arrival-schedule.entity';

export class ArrivalScheduleFilterDto {
  @IsOptional()
  search?: string;

  @IsOptional()
  @IsEnum(TransportationType)
  @Type(() => String)
  transportationType?: TransportationType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
