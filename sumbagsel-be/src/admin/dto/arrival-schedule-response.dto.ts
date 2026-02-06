export class ArrivalScheduleResponseDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  transportationType: string | null;
  carrierName: string | null;
  flightNumber: string | null;
  arrivalDate: string | null;
  arrivalTime: string | null;
  createdAt: string;
}

export class ArrivalScheduleSummaryDto {
  totalArrivals: number;
  byAir: number;
  bySea: number;
}

export class ArrivalScheduleGroupedDto {
  date: string;
  formattedDate: string;
  count: number;
  arrivals: ArrivalScheduleResponseDto[];
}
