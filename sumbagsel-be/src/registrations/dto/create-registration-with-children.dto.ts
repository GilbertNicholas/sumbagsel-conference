import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsString,
  IsNumber,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class ChildDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsNumber()
  @Min(7)
  @Max(12)
  age: number;
}

export class CreateRegistrationWithChildrenDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChildDto)
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  children: { name: string; age: number }[];
}
