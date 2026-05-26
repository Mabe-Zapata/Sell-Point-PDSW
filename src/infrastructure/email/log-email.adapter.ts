import { Injectable, Logger } from '@nestjs/common';
import { IEmailService, SendResult } from '../../application/ports/IEmailService';

@Injectable()
export class LogEmailAdapter implements IEmailService {
  private readonly logger = new Logger(LogEmailAdapter.name);

  async sendPasswordReset(to: string, data: { firstName: string; resetUrl: string; expiresInMinutes: number }): Promise<SendResult> {
    this.logger.log(`[EMAIL] Password Reset | To: ${to} | Data: ${JSON.stringify(data)}`);
    return await new Promise((resolve) => {
      resolve({
        success: true,
        messageId: `log-${Date.now()}`,
      });
    });
  }

  async sendInvoice(to: string, invoiceId: string, data: { invoiceNumber: string; date: string; customerName: string; items: Array<{ description: string; quantity: number; unitPrice: number; subtotal: number }>; total: number; seriesNumber?: string }): Promise<SendResult> {
    this.logger.log(`[EMAIL] Invoice | To: ${to} | InvoiceId: ${invoiceId} | Data: ${JSON.stringify(data)}`);
    return await new Promise((resolve) => {
      resolve({
        success: true,
        messageId: `log-${Date.now()}`,
      });
    });
  }

  async sendEmployeeCredentials(to: string, data: { firstName: string; username: string; temporaryPassword: string; loginUrl: string }): Promise<SendResult> {
    this.logger.log(`[EMAIL] Employee Credentials | To: ${to} | Data: ${JSON.stringify(data)}`);
    return await new Promise((resolve) => {
      resolve({
        success: true,
        messageId: `log-${Date.now()}`,
      });
    });
  }

  async sendPasswordChangeNotification(to: string, data: { firstName: string; changedAt: string }): Promise<SendResult> {
    this.logger.log(`[EMAIL] Password Change Notification | To: ${to} | Data: ${JSON.stringify(data)}`);
    return await new Promise((resolve) => {
      resolve({
        success: true,
        messageId: `log-${Date.now()}`,
      });
    });
  }
}
