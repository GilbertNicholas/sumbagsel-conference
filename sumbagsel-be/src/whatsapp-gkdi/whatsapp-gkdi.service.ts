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
      this.logger.error('Failed to get GKDI token', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp message via GKDI API.
   * @param phoneNumber - Recipient in international format (628xxxxxxxxxx, no leading 0)
   * @param message - Text content to send
   */
  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    const token = await this.getToken();

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
    } catch (error) {
      this.logger.error(`Failed to send message to ${phoneNumber}`, error);
      throw error;
    }
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
