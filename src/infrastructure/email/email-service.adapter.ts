import { Injectable } from '@nestjs/common';
import type { IEmailService, InvoiceData, SendResult, PasswordResetData, EmployeeCredentialsData, PasswordChangeData } from '../../application/ports/IEmailService';
import type { ITemplateCompiler } from './interfaces/ITemplateCompiler.interface';
import type { IEmailTransporter } from './interfaces/IEmailTransporter.interface';

@Injectable()
export class EmailServiceAdapter implements IEmailService {
  constructor(
    private readonly templateCompiler: ITemplateCompiler,
    private readonly emailTransporter: IEmailTransporter,
  ) {}

  async sendPasswordReset(to: string, data: PasswordResetData): Promise<SendResult> {
    const htmlContent = await this.templateCompiler.compile('password-reset', data);
    return this.emailTransporter.send(to, 'Restablece tu contraseña', htmlContent);
  }

  async sendInvoice(to: string, invoiceId: string, data: InvoiceData): Promise<SendResult> {
    const htmlContent = await this.templateCompiler.compile('invoice', {
      ...data,
      invoiceId,
    });
    return this.emailTransporter.send(to, 'Confirmación de tu compra', htmlContent, data.attachments);
  }

  async sendEmployeeCredentials(to: string, data: EmployeeCredentialsData): Promise<SendResult> {
    const htmlContent = await this.templateCompiler.compile('new-employee-credentials', data);
    return this.emailTransporter.send(to, 'Tus credenciales de acceso', htmlContent);
  }

  async sendPasswordChangeNotification(to: string, data: PasswordChangeData): Promise<SendResult> {
    const htmlContent = await this.templateCompiler.compile('password-change-notification', data);
    return this.emailTransporter.send(to, 'Tu contraseña ha sido cambiada', htmlContent);
  }
}
