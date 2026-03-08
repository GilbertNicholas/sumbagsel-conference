import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    if (!smtpHost || !smtpHost.trim()) {
      this.logger.warn('SMTP not configured, cannot send OTP email');
      throw new Error('SMTP tidak dikonfigurasi. Silakan hubungi admin.');
    }

    await this.mailerService.sendMail({
      to,
      subject: 'Kode Verifikasi SumBagSel',
      template: 'otp',
      context: { otp },
    });
    this.logger.debug(`OTP email sent to ${to}`);
  }
}
