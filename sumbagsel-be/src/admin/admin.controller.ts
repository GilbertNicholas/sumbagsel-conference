import { Controller, Post, Body, UseGuards, Get, Param, Patch, Query, Res, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRequestOtpDto } from './dto/admin-request-otp.dto';
import { AdminVerifyOtpDto } from './dto/admin-verify-otp.dto';
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

  @Post('request-otp')
  async requestOtp(@Body() dto: AdminRequestOtpDto): Promise<{ sent: boolean }> {
    return this.adminService.requestOtp(dto.phoneNumber);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: AdminVerifyOtpDto): Promise<AdminAuthResponseDto> {
    return this.adminService.verifyOtpAndLogin(dto.phoneNumber, dto.otp);
  }

  /**
   * Bypass OTP - direct login with phone. Only works when OTP_BYPASS_DEV=true.
   * For development/testing only.
   */
  @Post('login-with-phone')
  async loginWithPhone(@Body() dto: AdminRequestOtpDto): Promise<AdminAuthResponseDto> {
    if (process.env.OTP_BYPASS_DEV !== 'true') {
      throw new ForbiddenException('OTP bypass hanya tersedia di mode development');
    }
    return this.adminService.loginWithPhone(dto.phoneNumber);
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

  @Patch('participants/:id/reject')
  @UseGuards(AdminAuthGuard)
  async rejectRegistration(@Param('id') id: string): Promise<ParticipantDetailResponseDto> {
    return this.adminService.rejectRegistration(id);
  }

  @Patch('participants/:id/check-in')
  @UseGuards(AdminAuthGuard)
  async checkInParticipant(@Param('id') id: string): Promise<ParticipantDetailResponseDto> {
    return this.adminService.checkInParticipant(id);
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
