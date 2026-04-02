import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, hours, minutes } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { UserIdentity } from './entities/user-identity.entity';
import { Profile } from './entities/profile.entity';
import { Registration } from './entities/registration.entity';
import { ArrivalSchedule } from './entities/arrival-schedule.entity';
import { Admin } from './entities/admin.entity';
import { OtpVerification } from './entities/otp-verification.entity';
import { RegistrationChild } from './entities/registration-child.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { ArrivalSchedulesModule } from './arrival-schedules/arrival-schedules.module';
import { AdminModule } from './admin/admin.module';
import { UploadsModule } from './uploads/uploads.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'otp-request',
        ttl: hours(1),
        limit: 20,
      },
      {
        name: 'otp-verify',
        ttl: minutes(15),
        limit: 15,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}.local`,
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const isProduction = nodeEnv === 'production';
        const isStaging = nodeEnv === 'staging';
        
        return {
        type: 'mysql',
        url: configService.get<string>('DATABASE_URL'),
          entities: [User, UserIdentity, Profile, Registration, RegistrationChild, ArrivalSchedule, Admin, OtpVerification],
          migrations: ['dist/migrations/*.js'],
          migrationsRun: false,
          // Only enable synchronize in development
          synchronize: !isProduction && !isStaging,
          logging: !isProduction,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    MailModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    RegistrationsModule,
    ArrivalSchedulesModule,
    AdminModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
