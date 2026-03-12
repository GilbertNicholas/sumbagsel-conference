import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * GKDI WhatsApp API Service
 * Documentation: https://documenter.getpostman.com/view/48771516/2sBXcDF1NY
 *
 * Base URL: https://ticketapi.gkdi.org/api/v2
 * - GET /token: Retrieve authentication token (no auth required)
 * - POST /message/send: Send WhatsApp message (requires x-api-token header)
 */
@Injectable()
export class WhatsappGkdiService {
  private readonly logger = new Logger(WhatsappGkdiService.name);
  private readonly baseUrl: string;
  private cachedToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private readonly TOKEN_CACHE_MINUTES = 55; // Refresh before 1 hour expiry
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl =
      this.configService.get<string>('GKDI_API_URL') ||
      'https://ticketapi.gkdi.org/api/v2';
  }

  /**
   * Get authentication token from GKDI API.
   * Token is used in x-api-token header for subsequent requests.
   * Caches token to avoid unnecessary API calls.
   * Retries up to MAX_RETRIES on network errors (ETIMEDOUT, ENETUNREACH).
   */
  async getToken(): Promise<string> {
    const now = new Date();
    if (
      this.cachedToken &&
      this.tokenExpiry &&
      now < this.tokenExpiry
    ) {
      return this.cachedToken;
    }

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<{
            success: boolean;
            data?: { token: string };
            error?: string | null;
          }>(`${this.baseUrl}/token`, {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          }),
        ) as { data: { success: boolean; data?: { token: string }; error?: string | null } };

        if (!response.data.success || !response.data.data?.token) {
          throw new Error(
            response.data.error || 'Failed to retrieve token from GKDI API',
          );
        }

        const token = response.data.data.token;
        this.cachedToken = token;
        this.tokenExpiry = new Date();
        this.tokenExpiry.setMinutes(
          this.tokenExpiry.getMinutes() + this.TOKEN_CACHE_MINUTES,
        );

        this.logger.debug('GKDI token retrieved successfully');
        return token;
      } catch (error) {
        lastError = error as Error;
        const err = lastError as Error & { code?: string; cause?: Error & { code?: string } };
        const code = err?.code ?? err?.cause?.code;
        const msg = lastError?.message ?? '';
        const isRetryable =
          code === 'ETIMEDOUT' ||
          code === 'ENETUNREACH' ||
          code === 'ECONNRESET' ||
          code === 'ECONNREFUSED' ||
          msg.includes('ETIMEDOUT') ||
          msg.includes('ENETUNREACH');
        if (isRetryable && attempt < this.MAX_RETRIES) {
          this.logger.warn(
            `GKDI token attempt ${attempt}/${this.MAX_RETRIES} failed, retrying in ${this.RETRY_DELAY_MS}ms`,
            code ?? lastError?.message,
          );
          await new Promise((r) => setTimeout(r, this.RETRY_DELAY_MS));
        } else {
          this.logger.error('Failed to get GKDI token', lastError);
          throw lastError;
        }
      }
    }
    throw lastError ?? new Error('Failed to get GKDI token');
  }

  /**
   * Send WhatsApp message via GKDI API.
   * Retries up to MAX_RETRIES on network errors.
   * @param phoneNumber - Recipient in international format (628xxxxxxxxxx, no leading 0)
   * @param message - Text content to send
   */
  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    const token = await this.getToken();

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.post<{
            success: boolean;
            error?: string | null;
            data?: { key?: { id: string }; status?: string };
          }>(
            `${this.baseUrl}/message/send`,
            {
              IDDevice: '',
              PhoneNumber: phoneNumber,
              Message: message,
            },
            {
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'x-api-token': token,
              },
            },
          ),
        ) as { data: { success: boolean; error?: string | null; data?: { status?: string } } };

        if (!response.data.success) {
          throw new Error(
            response.data.error || 'Failed to send message via GKDI API',
          );
        }

        this.logger.debug(
          `Message sent to ${phoneNumber}, status: ${response.data.data?.status || 'unknown'}`,
        );
        return;
      } catch (error) {
        lastError = error as Error;
        const err = lastError as Error & { code?: string; cause?: Error & { code?: string } };
        const code = err?.code ?? err?.cause?.code;
        const msg = lastError?.message ?? '';
        const isRetryable =
          code === 'ETIMEDOUT' ||
          code === 'ENETUNREACH' ||
          code === 'ECONNRESET' ||
          code === 'ECONNREFUSED' ||
          msg.includes('ETIMEDOUT') ||
          msg.includes('ENETUNREACH');
        if (isRetryable && attempt < this.MAX_RETRIES) {
          this.logger.warn(
            `Send message to ${phoneNumber} attempt ${attempt}/${this.MAX_RETRIES} failed, retrying in ${this.RETRY_DELAY_MS}ms`,
            code ?? lastError?.message,
          );
          await new Promise((r) => setTimeout(r, this.RETRY_DELAY_MS));
        } else {
          this.logger.error(`Failed to send message to ${phoneNumber}`, lastError);
          throw lastError;
        }
      }
    }
    throw lastError ?? new Error('Failed to send message via GKDI API');
  }

  /**
   * Convert phone number to GKDI format (628xxxxxxxxxx).
   * Handles 08xx, +628xx, 628xx formats.
   */
  toGkdiPhoneFormat(phoneNumber: string): string {
    let normalized = phoneNumber.replace(/[\s-]/g, '');
    if (normalized.startsWith('+62')) {
      normalized = '62' + normalized.substring(3);
    } else if (normalized.startsWith('0')) {
      normalized = '62' + normalized.substring(1);
    } else if (!normalized.startsWith('62')) {
      normalized = '62' + normalized;
    }
    return normalized;
  }
}
