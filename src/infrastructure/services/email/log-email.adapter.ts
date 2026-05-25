import { Injectable, Logger } from '@nestjs/common';
import { IEmailService, EmailTemplate, SendResult } from '../../../application/services/interfaces/email-service.interface';

@Injectable()
export class LogEmailAdapter implements IEmailService {
  private readonly logger = new Logger(LogEmailAdapter.name);

  async send(to: string, template: EmailTemplate, data: Record<string, unknown>): Promise<SendResult> {
    this.logger.log(`[EMAIL] To: ${to}, Template: ${String(template)}, Data: ${JSON.stringify(data)}`);
    return await Promise.resolve({
      success: true,
      messageId: `log-${Date.now()}`,
    });
  }
}