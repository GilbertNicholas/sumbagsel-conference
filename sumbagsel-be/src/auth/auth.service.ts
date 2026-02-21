import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserStatus } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { UsersService } from '../users/users.service';
import { OtpService } from '../otp/otp.service';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  /**
   * Normalize phone number to consistent format (08xx)
   * Handles +628xx -> 08xx and 08xx -> 08xx
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove spaces and dashes
    let normalized = phoneNumber.replace(/[\s-]/g, '');
    
    // Convert +628xx to 08xx
    if (normalized.startsWith('+62')) {
      normalized = '0' + normalized.substring(3);
    }
    
    // Ensure starts with 0
    if (!normalized.startsWith('0')) {
      normalized = '0' + normalized;
    }
    
    return normalized;
  }

  /**
   * Request OTP to be sent via WhatsApp.
   * Rate limited per phone number.
   */
  async requestOtp(phoneNumber: string): Promise<{ sent: boolean }> {
    return this.otpService.create(phoneNumber);
  }

  /**
   * Verify OTP and login. Returns JWT on success.
   */
  async verifyOtpAndLogin(
    phoneNumber: string,
    otp: string,
  ): Promise<AuthResponseDto> {
    await this.otpService.verify(phoneNumber, otp);
    return this.loginWithPhone(phoneNumber);
  }

  async loginWithPhone(phoneNumber: string): Promise<AuthResponseDto> {
    // Normalize phone number
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Check if user exists with this phone number
    let user = await this.usersService.findByPhoneNumber(normalizedPhone);

    if (!user) {
      // User doesn't exist, create new user and profile
      // Create user with null email
      const newUser = this.usersRepository.create({
        email: null,
        passwordHash: null,
        isEmailVerified: false,
        status: UserStatus.ACTIVE,
      });
      user = await this.usersRepository.save(newUser);

      // Create profile with phone number
      // Note: Profile requires fullName and churchName, so we set temporary placeholder values
      // User will need to complete profile via /profile/setup
      const newProfile = this.profilesRepository.create({
        userId: user.id,
        phoneNumber: normalizedPhone,
        fullName: 'Belum diisi', // Temporary placeholder, user must complete profile
        churchName: 'Belum diisi', // Temporary placeholder, user must complete profile
        isCompleted: false,
      });
      await this.profilesRepository.save(newProfile);
    } else {
      // User exists, check if active
      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Account is not active');
      }
    }

    // Check profile status
    const profileStatus = await this.usersService.checkProfileStatus(user.id);

    // Generate JWT token
    const accessToken = this.generateToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
      },
      profileExists: profileStatus.profileExists,
      profileCompleted: profileStatus.profileCompleted,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  async createAuthResponse(user: User): Promise<AuthResponseDto> {
    // Check profile status
    const profileStatus = await this.usersService.checkProfileStatus(user.id);

    // Generate JWT token
    const accessToken = this.generateToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
      },
      profileExists: profileStatus.profileExists,
      profileCompleted: profileStatus.profileCompleted,
    };
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email || null };
    return this.jwtService.sign(payload);
  }
}

