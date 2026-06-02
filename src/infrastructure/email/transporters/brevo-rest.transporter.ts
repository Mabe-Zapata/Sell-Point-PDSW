import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import type { IEmailTransporter, Attachment, SendResult } from '../interfaces/IEmailTransporter.interface';

export class EmailServiceUnavailableError extends Error {
  constructor(recipient: string) {
    super(`Email service unavailable for recipient: ${recipient}`);
    this.name = 'EmailServiceUnavailableError';
  }
}

@Injectable()
export class BrevoRestTransporter implements IEmailTransporter {
  private readonly client: AxiosInstance;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private readonly configService: ConfigService) {
    this.senderEmail = this.configService.get<string>('brevo.senderEmail') ?? 'noreply@sellpoint.com';
    this.senderName = this.configService.get<string>('brevo.senderName') ?? 'Sell Point';

    const apiKey = this.configService.get<string>('brevo.apiKey') ?? '';

    this.client = axios.create({
      baseURL: 'https://api.brevo.com',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.configureRetry();
  }

  private configureRetry(): void {
    try {
      axiosRetry(this.client, {
        retries: 3,
        retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000,
        retryCondition: (error) => {
          return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
        },
      });
    } catch {
      // Retry configuration failure is non-fatal - continue without retries
    }
  }

  async send(to: string, subject: string, htmlContent: string, attachments?: Attachment[]): Promise<SendResult> {
    if (!to || to.trim() === '') {
      throw new EmailServiceUnavailableError('empty recipient');
    }

    try {
      const emailPayload: Record<string, unknown> = {
        to: [{ email: to }],
        subject,
        htmlContent,
        sender: { email: this.senderEmail, name: this.senderName },
      };

      if (attachments && attachments.length > 0) {
        emailPayload['attachment'] = attachments.map((att) => ({
          name: att.filename,
          content: att.content.toString('base64'),
          mimetype: att.mimetype,
        }));
      }

      console.log(`[BrevoTransporter] Sending email to ${to} with subject "${subject}"`);
      const response = await this.client.post('/v3/smtp/email', emailPayload);
      console.log(`[BrevoTransporter] Email sent successfully. MessageId: ${response.data?.messageId}`);

      return {
        success: true,
        messageId: response.data?.messageId ?? '',
      };
    } catch (error: any) {
      console.error(`[BrevoTransporter] Failed to send email to ${to}:`, error?.response?.data ?? error.message);
      throw new EmailServiceUnavailableError(to);
    }
  }
}
