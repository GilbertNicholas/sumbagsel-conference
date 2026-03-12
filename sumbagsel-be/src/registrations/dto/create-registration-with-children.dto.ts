import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  MinLength,
  IsIn,
  IsOptional,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const SHIRT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;

class ChildDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsNumber()
  @Min(7)
  @Max(12)
  age: number;

  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  @IsBoolean()
  needsConsumption: boolean;
}

export class CreateRegistrationWithChildrenDto {
  @IsString()
  @IsOptional()
  @IsIn(SHIRT_SIZE_OPTIONS, { message: 'Shirt size must be XS, S, M, L, XL, XXL, or XXXL' })
  shirtSize?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChildDto)
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  children: { name: string; age: number; needsConsumption: boolean }[];
}
