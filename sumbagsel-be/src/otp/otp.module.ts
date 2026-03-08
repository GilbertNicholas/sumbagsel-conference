import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpVerification } from '../entities/otp-verification.entity';
import { OtpService } from './otp.service';
import { WhatsappGkdiModule } from '../whatsapp-gkdi/whatsapp-gkdi.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OtpVerification]),
    WhatsappGkdiModule,
    MailModule,
  ],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
