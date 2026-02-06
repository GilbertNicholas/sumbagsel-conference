import { TransportationType } from '../../entities/arrival-schedule.entity';

export class ArrivalScheduleResponseDto {
  id: string;
  transportationType: TransportationType | null;
  carrierName: string | null;
  flightNumber: string | null;
  arrivalDate: Date | null;
  arrivalTime: string | null;
  createdAt: Date;
  updatedAt: Date;
}
