import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ArrivalSchedulesService } from './arrival-schedules.service';
import { CreateArrivalScheduleDto } from './dto/create-arrival-schedule.dto';
import { UpdateArrivalScheduleDto } from './dto/update-arrival-schedule.dto';
import { ArrivalScheduleResponseDto } from './dto/arrival-schedule-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('arrival-schedules')
@UseGuards(JwtAuthGuard)
export class ArrivalSchedulesController {
  constructor(private readonly arrivalSchedulesService: ArrivalSchedulesService) {}

  @Get('me')
  async getMyArrivalSchedule(
    @CurrentUser() user: User,
  ): Promise<ArrivalScheduleResponseDto | null> {
    return this.arrivalSchedulesService.findOneByUserId(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createArrivalSchedule(
    @CurrentUser() user: User,
    @Body() createArrivalScheduleDto: CreateArrivalScheduleDto,
  ): Promise<ArrivalScheduleResponseDto> {
    return this.arrivalSchedulesService.create(user.id, createArrivalScheduleDto);
  }

  @Patch('me')
  async updateMyArrivalSchedule(
    @CurrentUser() user: User,
    @Body() updateArrivalScheduleDto: UpdateArrivalScheduleDto,
  ): Promise<ArrivalScheduleResponseDto> {
    return this.arrivalSchedulesService.update(user.id, updateArrivalScheduleDto);
  }
}
