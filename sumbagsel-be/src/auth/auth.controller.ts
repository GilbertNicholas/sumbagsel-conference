import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<AuthResponseDto> {
    return this.authService.signup(signupDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req): Promise<AuthResponseDto> {
    // After LocalAuthGuard validates, user is attached to request
    const user = req.user;
    return this.authService.createAuthResponse(user);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Request() req, @Res() res: Response) {
    // After GoogleAuthGuard validates, user is attached to request
    const user = req.user;

    // Create auth response
    const authResponse = await this.authService.createAuthResponse(user);

    // Redirect to frontend with token
    const frontendRedirectUrl =
      this.configService.get<string>('FRONTEND_OAUTH_REDIRECT_URL') ||
      'http://localhost:3001/auth/callback';

    const redirectUrl = `${frontendRedirectUrl}?token=${authResponse.accessToken}`;
    res.redirect(redirectUrl);
  }
}

