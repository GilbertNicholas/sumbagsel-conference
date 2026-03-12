import { IsOptional, IsString } from 'class-validator';

export class ShirtDataFilterDto {
  @IsOptional()
  @IsString()
  church?: string;

  @IsOptional()
  @IsString()
  size?: string;
}
