import { IsIn, IsOptional, IsString } from 'class-validator';

export class ChildrenFilterDto {
  @IsOptional()
  @IsString()
  church?: string;

  @IsOptional()
  @IsIn(['yes', 'no'])
  needsConsumption?: 'yes' | 'no';

  @IsOptional()
  @IsString()
  checkInStatus?: 'checked-in' | 'not-checked-in';

  @IsOptional()
  @IsString()
  search?: string;
}
