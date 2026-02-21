import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  /**
   * Request OTP to be sent via WhatsApp.
   * Rate limited: 1 request per phone per minute.
   */
  @Post('request-otp')
  async requestOtp(@Body() dto: RequestOtpDto): Promise<{ sent: boolean }> {
    return this.authService.requestOtp(dto.phoneNumber);
  }

  /**
   * Verify OTP and login. Returns JWT on success.
   */
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<AuthResponseDto> {
    return this.authService.verifyOtpAndLogin(dto.phoneNumber, dto.otp);
  }

  /**
   * @deprecated Use request-otp + verify-otp flow instead.
   * Direct login without OTP (kept for backward compatibility).
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.loginWithPhone(loginDto.phoneNumber);
  }
}

