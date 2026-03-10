import { IsOptional, IsString } from 'class-validator';

export class ChildrenFilterDto {
  @IsOptional()
  @IsString()
  church?: string;

  @IsOptional()
  @IsString()
  age?: string;

  @IsOptional()
  @IsString()
  checkInStatus?: 'checked-in' | 'not-checked-in';

  @IsOptional()
  @IsString()
  search?: string;
}
