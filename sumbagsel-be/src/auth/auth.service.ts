import {
  Injectable,
  Logger,
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
  private readonly logger = new Logger(AuthService.name);

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
   * Pre-fetch GKDI WhatsApp token so it is cached when user requests OTP.
   * Best-effort: returns { ready: false } on failure instead of throwing.
   */
  async warmWhatsapp(): Promise<{ ready: boolean }> {
    try {
      return await this.otpService.warmWhatsapp();
    } catch (err) {
      this.logger.warn('Warm WhatsApp failed, token not cached', err);
      return { ready: false };
    }
  }

  private isEmail(identifier: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
  }

  /**
   * Request OTP to be sent via WhatsApp or Email.
   * Rate limited per identifier.
   */
  async requestOtp(identifier: string): Promise<{ sent: boolean }> {
    return this.otpService.create(identifier);
  }

  /**
   * Verify OTP and login. Returns JWT on success.
   */
  async verifyOtpAndLogin(
    identifier: string,
    otp: string,
  ): Promise<AuthResponseDto> {
    await this.otpService.verify(identifier, otp);
    return this.loginByIdentifier(identifier);
  }

  async loginByIdentifier(identifier: string): Promise<AuthResponseDto> {
    const trimmed = identifier.trim();

    let user = await this.usersService.findByIdentifier(trimmed);

    if (!user) {
      if (this.isEmail(trimmed)) {
        const normalizedEmail = trimmed.toLowerCase();
        const newUser = this.usersRepository.create({
          email: normalizedEmail,
          isEmailVerified: true,
          status: UserStatus.ACTIVE,
        });
        user = await this.usersRepository.save(newUser);
        const newProfile = this.profilesRepository.create({
          userId: user.id,
          phoneNumber: null,
          fullName: 'Belum diisi',
          churchName: 'Belum diisi',
          contactEmail: normalizedEmail,
          isCompleted: false,
        });
        await this.profilesRepository.save(newProfile);
      } else {
        const normalizedPhone = this.normalizePhoneNumber(trimmed);
        const newUser = this.usersRepository.create({
          email: null,
          isEmailVerified: false,
          status: UserStatus.ACTIVE,
        });
        user = await this.usersRepository.save(newUser);
        const newProfile = this.profilesRepository.create({
          userId: user.id,
          phoneNumber: normalizedPhone,
          fullName: 'Belum diisi',
          churchName: 'Belum diisi',
          contactEmail: null,
          isCompleted: false,
        });
        await this.profilesRepository.save(newProfile);
      }
    } else {
      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Account is not active');
      }
    }

    const profileStatus = await this.usersService.checkProfileStatus(user.id);
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

  /** @deprecated Use loginByIdentifier instead */
  async loginWithPhone(phoneNumber: string): Promise<AuthResponseDto> {
    return this.loginByIdentifier(phoneNumber);
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

