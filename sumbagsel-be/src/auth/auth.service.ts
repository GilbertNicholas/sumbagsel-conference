import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../entities/user.entity';
import { UserIdentity, Provider } from '../entities/user-identity.entity';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

interface GoogleUserData {
  googleId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserIdentity)
    private userIdentitiesRepository: Repository<UserIdentity>,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    const { email, password } = signupDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = this.usersRepository.create({
      email,
      passwordHash,
      isEmailVerified: false,
      status: UserStatus.ACTIVE,
    });
    const savedUser = await this.usersRepository.save(user);

    // Create local identity
    const identity = this.userIdentitiesRepository.create({
      userId: savedUser.id,
      provider: Provider.LOCAL,
      providerUserId: email,
    });
    await this.userIdentitiesRepository.save(identity);

    // Check profile status
    const profileStatus = await this.usersService.checkProfileStatus(
      savedUser.id,
    );

    // Generate JWT token
    const accessToken = this.generateToken(savedUser);

    return {
      accessToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        isEmailVerified: savedUser.isEmailVerified,
        status: savedUser.status,
      },
      profileExists: profileStatus.profileExists,
      profileCompleted: profileStatus.profileCompleted,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has password (local auth)
    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
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

  async validateUserByEmail(email: string): Promise<User | null> {
    return this.usersService.findByEmail(email);
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

  async validateOrCreateGoogleUser(
    googleData: GoogleUserData,
  ): Promise<User> {
    const { googleId, email, firstName, lastName } = googleData;

    // Step 1: Check if Google identity already exists
    const existingIdentity = await this.userIdentitiesRepository.findOne({
      where: {
        provider: Provider.GOOGLE,
        providerUserId: googleId,
      },
      relations: ['user'],
    });

    if (existingIdentity) {
      // User already exists with this Google account, return the user
      return existingIdentity.user;
    }

    // Step 2: Check if user exists with this email
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      // User exists with this email, link Google identity to existing user
      // Check if Google identity already linked (shouldn't happen due to step 1, but double-check)
      const existingGoogleIdentity = await this.userIdentitiesRepository.findOne({
        where: {
          userId: existingUser.id,
          provider: Provider.GOOGLE,
        },
      });

      if (!existingGoogleIdentity) {
        // Link Google identity to existing user
        const identity = this.userIdentitiesRepository.create({
          userId: existingUser.id,
          provider: Provider.GOOGLE,
          providerUserId: googleId,
        });
        await this.userIdentitiesRepository.save(identity);
      }

      return existingUser;
    }

    // Step 3: Create new user and Google identity
    const newUser = this.usersRepository.create({
      email,
      passwordHash: null, // No password for Google OAuth users
      isEmailVerified: true, // Google emails are verified
      status: UserStatus.ACTIVE,
    });
    const savedUser = await this.usersRepository.save(newUser);

    // Create Google identity
    const identity = this.userIdentitiesRepository.create({
      userId: savedUser.id,
      provider: Provider.GOOGLE,
      providerUserId: googleId,
    });
    await this.userIdentitiesRepository.save(identity);

    return savedUser;
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}

