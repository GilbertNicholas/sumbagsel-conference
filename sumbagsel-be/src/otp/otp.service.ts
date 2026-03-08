import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { OtpVerification } from '../entities/otp-verification.entity';
import { WhatsappGkdiService } from '../whatsapp-gkdi/whatsapp-gkdi.service';
import { MailService } from '../mail/mail.service';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const RATE_LIMIT_MINUTES = 4;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpVerification)
    private otpRepository: Repository<OtpVerification>,
    private whatsappGkdiService: WhatsappGkdiService,
    private mailService: MailService,
  ) {}

  private isEmail(identifier: string): boolean {
    return EMAIL_REGEX.test(identifier.trim());
  }

  /**
   * Normalize phone number to 08xx format for storage.
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    let normalized = phoneNumber.replace(/[\s-]/g, '');
    if (normalized.startsWith('+62')) {
      normalized = '0' + normalized.substring(3);
    }
    if (!normalized.startsWith('0')) {
      normalized = '0' + normalized;
    }
    return normalized;
  }

  /**
   * Generate random 6-digit OTP.
   */
  private generateOtp(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  /**
   * Create OTP, store in DB, and send via WhatsApp or Email.
   * Identifier can be phone number or email. Rate limit per identifier.
   */
  async create(identifier: string): Promise<{ sent: boolean }> {
    const trimmed = identifier.trim();
    if (!trimmed) {
      throw new BadRequestException('Nomor WhatsApp atau email harus diisi.');
    }

    if (this.isEmail(trimmed)) {
      return this.createForEmail(trimmed.toLowerCase());
    }
    return this.createForPhone(trimmed);
  }

  private async createForPhone(phoneNumber: string): Promise<{ sent: boolean }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    const recentOtp = await this.otpRepository.findOne({
      where: { phoneNumber: normalizedPhone },
      order: { createdAt: 'DESC' },
    });

    if (recentOtp) {
      const rateLimitExpiry = new Date(recentOtp.createdAt);
      rateLimitExpiry.setMinutes(
        rateLimitExpiry.getMinutes() + RATE_LIMIT_MINUTES,
      );
      if (new Date() < rateLimitExpiry) {
        const waitSeconds = Math.ceil(
          (rateLimitExpiry.getTime() - Date.now()) / 1000,
        );
        throw new HttpException(
          `Tunggu ${waitSeconds} detik sebelum meminta kode baru`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    await this.otpRepository.delete({ phoneNumber: normalizedPhone });

    const otp = this.generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    const otpRecord = this.otpRepository.create({
      phoneNumber: normalizedPhone,
      email: null,
      otp,
      expiresAt,
      attempts: 0,
    });
    await this.otpRepository.save(otpRecord);

    const gkdiPhone = this.whatsappGkdiService.toGkdiPhoneFormat(normalizedPhone);
    const message = `Kode verifikasi SumBagSel Anda: ${otp}. Berlaku ${OTP_EXPIRY_MINUTES} menit. Jangan bagikan kode ini kepada siapapun.`;

    try {
      await this.whatsappGkdiService.sendMessage(gkdiPhone, message);
    } catch (sendError) {
      await this.otpRepository.delete({ phoneNumber: normalizedPhone });
      throw new HttpException(
        'Gagal mengirim kode verifikasi. Silakan coba lagi.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { sent: true };
  }

  private async createForEmail(email: string): Promise<{ sent: boolean }> {
    const recentOtp = await this.otpRepository.findOne({
      where: { email },
      order: { createdAt: 'DESC' },
    });

    if (recentOtp) {
      const rateLimitExpiry = new Date(recentOtp.createdAt);
      rateLimitExpiry.setMinutes(
        rateLimitExpiry.getMinutes() + RATE_LIMIT_MINUTES,
      );
      if (new Date() < rateLimitExpiry) {
        const waitSeconds = Math.ceil(
          (rateLimitExpiry.getTime() - Date.now()) / 1000,
        );
        throw new HttpException(
          `Tunggu ${waitSeconds} detik sebelum meminta kode baru`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    await this.otpRepository.delete({ email });

    const otp = this.generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    const otpRecord = this.otpRepository.create({
      phoneNumber: null,
      email,
      otp,
      expiresAt,
      attempts: 0,
    });
    await this.otpRepository.save(otpRecord);

    try {
      await this.mailService.sendOtpEmail(email, otp);
    } catch (sendError) {
      await this.otpRepository.delete({ email });
      throw new HttpException(
        sendError instanceof Error ? sendError.message : 'Gagal mengirim kode verifikasi ke email. Silakan coba lagi.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { sent: true };
  }

  /**
   * Pre-fetch GKDI WhatsApp token so it is cached when user requests OTP.
   * Call this when user clicks "Daftar dengan WhatsApp" on landing page.
   */
  async warmWhatsapp(): Promise<{ ready: boolean }> {
    await this.whatsappGkdiService.getToken();
    return { ready: true };
  }

  /**
   * Verify OTP and invalidate if successful.
   * Identifier can be phone number or email.
   */
  async verify(identifier: string, otp: string): Promise<boolean> {
    const trimmed = identifier.trim();
    if (!trimmed) {
      throw new BadRequestException('Nomor WhatsApp atau email harus diisi.');
    }

    let otpRecord: OtpVerification | null;

    if (this.isEmail(trimmed)) {
      otpRecord = await this.otpRepository.findOne({
        where: { email: trimmed.toLowerCase() },
        order: { createdAt: 'DESC' },
      });
    } else {
      const normalizedPhone = this.normalizePhoneNumber(trimmed);
      otpRecord = await this.otpRepository.findOne({
        where: { phoneNumber: normalizedPhone },
        order: { createdAt: 'DESC' },
      });
    }

    if (!otpRecord) {
      throw new BadRequestException('Kode verifikasi tidak ditemukan. Silakan minta kode baru.');
    }

    if (new Date() > otpRecord.expiresAt) {
      await this.otpRepository.remove(otpRecord);
      throw new BadRequestException('Kode verifikasi telah kadaluarsa. Silakan minta kode baru.');
    }

    if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
      await this.otpRepository.remove(otpRecord);
      throw new BadRequestException(
        'Terlalu banyak percobaan salah. Silakan minta kode baru.',
      );
    }

    otpRecord.attempts += 1;
    await this.otpRepository.save(otpRecord);

    if (otpRecord.otp !== otp) {
      throw new BadRequestException('Kode verifikasi salah.');
    }

    await this.otpRepository.remove(otpRecord);
    return true;
  }

  /**
   * Clean up expired OTP records (can be called by cron).
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected ?? 0;
  }
}
