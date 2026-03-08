import {
  Controller,
  Get,
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
   * Pre-fetch GKDI WhatsApp token. Call when user clicks "Daftar dengan WhatsApp"
   * on landing page so token is ready when they request OTP on login page.
   */
  @Get('warm-whatsapp')
  async warmWhatsapp(): Promise<{ ready: boolean }> {
    return this.authService.warmWhatsapp();
  }

  /**
   * Request OTP to be sent via WhatsApp or Email.
   * Identifier: phone number or email. Rate limited per identifier.
   */
  @Post('request-otp')
  async requestOtp(@Body() dto: RequestOtpDto): Promise<{ sent: boolean }> {
    return this.authService.requestOtp(dto.identifier);
  }

  /**
   * Verify OTP and login. Returns JWT on success.
   */
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<AuthResponseDto> {
    return this.authService.verifyOtpAndLogin(dto.identifier, dto.otp);
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

