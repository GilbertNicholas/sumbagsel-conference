import { Controller, Post, Body, UseGuards, Get, Param, Patch, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminAuthResponseDto } from './dto/admin-auth-response.dto';
import { ParticipantResponseDto } from './dto/participant-response.dto';
import { ParticipantDetailResponseDto } from './dto/participant-detail-response.dto';
import { ArrivalScheduleFilterDto } from './dto/arrival-schedule-filter.dto';
import { ArrivalScheduleGroupedDto } from './dto/arrival-schedule-response.dto';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { Admin } from '../entities/admin.entity';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async login(@Body() loginDto: AdminLoginDto): Promise<AdminAuthResponseDto> {
    return this.adminService.login(loginDto);
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  async getMe(@CurrentAdmin() admin: Admin) {
    return {
      id: admin.id,
      code: admin.code,
      name: admin.name,
    };
  }

  @Get('participants')
  @UseGuards(AdminAuthGuard)
  async getAllParticipants(): Promise<ParticipantResponseDto[]> {
    return this.adminService.getAllParticipants();
  }

  @Get('participants/:id')
  @UseGuards(AdminAuthGuard)
  async getParticipantById(@Param('id') id: string): Promise<ParticipantDetailResponseDto> {
    return this.adminService.getParticipantById(id);
  }

  @Patch('participants/:id/approve')
  @UseGuards(AdminAuthGuard)
  async approveRegistration(@Param('id') id: string): Promise<ParticipantDetailResponseDto> {
    return this.adminService.approveRegistration(id);
  }

  @Get('arrival-schedules')
  @UseGuards(AdminAuthGuard)
  async getArrivalSchedules(
    @Query() filter: ArrivalScheduleFilterDto,
  ): Promise<ArrivalScheduleGroupedDto[]> {
    try {
      return await this.adminService.getArrivalSchedules(filter || {});
    } catch (error) {
      console.error('Error in getArrivalSchedules controller:', error);
      throw error;
    }
  }

  @Get('arrival-schedules/summary')
  @UseGuards(AdminAuthGuard)
  async getArrivalScheduleSummary(
    @Query() filter: ArrivalScheduleFilterDto,
  ) {
    try {
      return await this.adminService.getArrivalScheduleSummary(filter || {});
    } catch (error) {
      console.error('Error in getArrivalScheduleSummary controller:', error);
      throw error;
    }
  }

  @Get('arrival-schedules/export')
  @UseGuards(AdminAuthGuard)
  async exportArrivalSchedulesToCsv(
    @Query() filter: ArrivalScheduleFilterDto,
    @Res() res: Response,
  ) {
    const csvContent = await this.adminService.exportArrivalSchedulesToCsv(filter);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=arrival-schedules.csv');
    res.send(csvContent);
  }
}
