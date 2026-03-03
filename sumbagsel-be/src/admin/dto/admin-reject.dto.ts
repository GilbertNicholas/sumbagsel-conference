import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class AdminRejectDto {
  @IsString()
  @IsNotEmpty({ message: 'Alasan penolakan tidak boleh kosong' })
  @MinLength(1, { message: 'Alasan penolakan tidak boleh kosong' })
  reason: string;
}
