import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { IEmailService, EmailTemplate, SendResult } from '../../../application/services/interfaces/email-service.interface';
import { EMAIL_SERVICE } from '../../../application/services/email-service.token';

export class InvalidTemplateError extends Error {
  constructor(template: EmailTemplate) {
    super(`Invalid template: ${String(template)}`);
    this.name = 'InvalidTemplateError';
  }
}

export class EmailServiceUnavailableError extends Error {
  constructor(recipient: string) {
    super(`Email service unavailable for recipient: ${recipient}`);
    this.name = 'EmailServiceUnavailableError';
  }
}

@Injectable()
export class BrevoEmailAdapter implements IEmailService {
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly templateMap: Map<EmailTemplate, number>;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('brevo.apiKey') ?? '';
    this.senderEmail = this.configService.get<string>('brevo.senderEmail') ?? 'noreply@sellpoint.com';
    this.senderName = this.configService.get<string>('brevo.senderName') ?? 'Sell Point';

    this.client = axios.create({
      baseURL: 'https://api.brevo.com',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    axiosRetry(this.client, {
      retries: 3,
      retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000,
      retryCondition: (error) => {
        return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
      },
    });

    this.templateMap = new Map<EmailTemplate, number>([
      [EmailTemplate.ORDER_CONFIRMATION, this.configService.get<number>('brevo.templates.orderConfirmation') ?? 1],
      [EmailTemplate.SALE_CANCELLED, this.configService.get<number>('brevo.templates.saleCancelled') ?? 2],
      [EmailTemplate.INVOICE, this.configService.get<number>('brevo.templates.invoice') ?? 3],
    ]);
  }

  async send(to: string, template: EmailTemplate, data: Record<string, unknown>): Promise<SendResult> {
    const templateId = this.templateMap.get(template);
    if (templateId === undefined) {
      throw new InvalidTemplateError(template);
    }

    try {
      const response = await this.client.post('/v3/smtp/email', {
        to: [{ email: to }],
        templateId,
        params: data,
        sender: { email: this.senderEmail, name: this.senderName },
      });

      return {
        success: true,
        messageId: response.data?.messageId ?? '',
      };
    } catch (error) {
      throw new EmailServiceUnavailableError(to);
    }
  }
}

export const emailProviderFactory = (configService: ConfigService): IEmailService => {
  const nodeEnv = configService.get<string>('app.mode');
  if (nodeEnv === 'production') {
    return new BrevoEmailAdapter(configService);
  }
  // Will be replaced with LogEmailAdapter in a later task
  return new BrevoEmailAdapter(configService);
};

export { EMAIL_SERVICE };