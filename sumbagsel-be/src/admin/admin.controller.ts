import { Controller, Post, Body, UseGuards, Get, Param, Patch, Query, Res } from '@nestjs/common';
import { ThrottlerGuard, Throttle, minutes } from '@nestjs/throttler';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminAuthResponseDto } from './dto/admin-auth-response.dto';
import { AdminRejectDto } from './dto/admin-reject.dto';
import { AdminUpdateParticipantContactDto } from './dto/admin-update-participant-contact.dto';
import { ParticipantResponseDto } from './dto/participant-response.dto';
import { ParticipantDetailResponseDto } from './dto/participant-detail-response.dto';
import { ArrivalScheduleFilterDto } from './dto/arrival-schedule-filter.dto';
import { ArrivalScheduleGroupedDto } from './dto/arrival-schedule-response.dto';
import { ShirtDataFilterDto } from './dto/shirt-data-filter.dto';
import { ShirtDataResponseDto } from './dto/shirt-data-response.dto';
import { ChildrenFilterDto } from './dto/children-filter.dto';
import { ChildrenResponseDto } from './dto/children-response.dto';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { Admin } from '../entities/admin.entity';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(ThrottlerGuard)
  @Throttle({ 'admin-login': { limit: 5, ttl: minutes(15) } })
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
      role: admin.role,
    };
  }

  @Get('participants')
  @UseGuards(AdminAuthGuard)
  async getAllParticipants(): Promise<ParticipantResponseDto[]> {
    return this.adminService.getAllParticipants();
  }

  @Get('shirt-data')
  @UseGuards(AdminAuthGuard)
  async getShirtData(@Query() filter: ShirtDataFilterDto): Promise<ShirtDataResponseDto> {
    return this.adminService.getShirtData(filter);
  }

  @Get('children')
  @UseGuards(AdminAuthGuard)
  async getChildren(@Query() filter: ChildrenFilterDto): Promise<ChildrenResponseDto> {
    return this.adminService.getChildren(filter);
  }

  @Get('participants/:id')
  @UseGuards(AdminAuthGuard)
  async getParticipantById(@Param('id') id: string): Promise<ParticipantDetailResponseDto> {
    return this.adminService.getParticipantById(id);
  }

  @Patch('participants/:id/approve')
  @UseGuards(AdminAuthGuard)
  async approveRegistration(
    @Param('id') id: string,
    @CurrentAdmin() admin: Admin,
  ): Promise<ParticipantDetailResponseDto> {
    return this.adminService.approveRegistration(id, admin);
  }

  @Patch('participants/:id/reject')
  @UseGuards(AdminAuthGuard)
  async rejectRegistration(
    @Param('id') id: string,
    @Body() dto: AdminRejectDto,
    @CurrentAdmin() admin: Admin,
  ): Promise<ParticipantDetailResponseDto> {
    return this.adminService.rejectRegistration(id, dto.reason, admin);
  }

  @Patch('participants/:id/contact')
  @UseGuards(AdminAuthGuard)
  async updateParticipantContact(
    @Param('id') id: string,
    @Body() dto: AdminUpdateParticipantContactDto,
  ): Promise<ParticipantDetailResponseDto> {
    return this.adminService.updateParticipantContact(id, dto);
  }

  @Patch('participants/:id/set-reregister')
  @UseGuards(AdminAuthGuard)
  async setReregister(
    @Param('id') id: string,
    @CurrentAdmin() admin: Admin,
  ): Promise<ParticipantDetailResponseDto> {
    return this.adminService.setReregister(id, admin);
  }

  @Patch('participants/:id/check-in')
  @UseGuards(AdminAuthGuard)
  async checkInParticipant(@Param('id') id: string): Promise<ParticipantDetailResponseDto> {
    return this.adminService.checkInParticipant(id);
  }

  @Patch('children/:id/check-in')
  @UseGuards(AdminAuthGuard)
  async checkInChild(@Param('id') id: string): Promise<ParticipantDetailResponseDto> {
    return this.adminService.checkInChild(id);
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
