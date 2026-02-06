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
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, Registration, User, Profile, ArrivalSchedule]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'change-me',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminJwtStrategy],
  exports: [AdminService],
})
export class AdminModule {}
