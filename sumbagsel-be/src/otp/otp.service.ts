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

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const RATE_LIMIT_MINUTES = 1;

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpVerification)
    private otpRepository: Repository<OtpVerification>,
    private whatsappGkdiService: WhatsappGkdiService,
  ) {}

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
   * Create OTP, store in DB, and send via WhatsApp.
   * Rate limit: 1 request per phone per RATE_LIMIT_MINUTES.
   */
  async create(phoneNumber: string): Promise<{ sent: boolean }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Rate limit: check if recent OTP exists
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

    // Invalidate any existing OTP for this phone
    await this.otpRepository.delete({ phoneNumber: normalizedPhone });

    const otp = this.generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    const otpRecord = this.otpRepository.create({
      phoneNumber: normalizedPhone,
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
      // Sending failed -- remove the OTP record so the user isn't penalised by the cooldown
      await this.otpRepository.delete({ phoneNumber: normalizedPhone });
      throw new HttpException(
        'Gagal mengirim kode verifikasi. Silakan coba lagi.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { sent: true };
  }

  /**
   * Verify OTP and invalidate if successful.
   */
  async verify(phoneNumber: string, otp: string): Promise<boolean> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    const otpRecord = await this.otpRepository.findOne({
      where: { phoneNumber: normalizedPhone },
      order: { createdAt: 'DESC' },
    });

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
