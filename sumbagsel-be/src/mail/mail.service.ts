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

  async sendRegistrationConfirmationEmail(
    to: string,
    context: {
      fullName: string;
      ministry: string;
      shirtSize: string | null;
      shirtSizes: string[] | null;
      children: Array<{ name: string; age: number; needsConsumption: boolean }>;
      ministryFee: number;
      baseAmount: number;
      uniqueCode: string | null;
      totalAmount: number;
      registrationId: string | null;
    },
  ): Promise<void> {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    if (!smtpHost || !smtpHost.trim()) {
      this.logger.warn('SMTP not configured, cannot send registration confirmation email');
      return;
    }

    const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

    await this.mailerService.sendMail({
      to,
      subject: 'Konfirmasi Pendaftaran - Konferensi Sumbagsel 2026',
      template: 'registration-confirmation',
      context: {
        ...context,
        ministryFeeFormatted: formatRupiah(context.ministryFee),
        baseAmountFormatted: formatRupiah(context.baseAmount),
        totalAmountFormatted: formatRupiah(context.totalAmount),
        childFeeFormatted: formatRupiah(75000),
        registrationId: context.registrationId ?? null,
      },
    });
    this.logger.debug(`Registration confirmation email sent to ${to}`);
  }
}
