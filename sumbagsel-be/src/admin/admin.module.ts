import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Admin } from '../entities/admin.entity';
import { Registration } from '../entities/registration.entity';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { ArrivalSchedule } from '../entities/arrival-schedule.entity';
import { RegistrationChild } from '../entities/registration-child.entity';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { OtpModule } from '../otp/otp.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, Registration, User, Profile, ArrivalSchedule, RegistrationChild]),
    OtpModule,
    MailModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'change-me',
        signOptions: { expiresIn: '12h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminJwtStrategy],
  exports: [AdminService],
})
export class AdminModule {}
