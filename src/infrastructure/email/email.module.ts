import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';
import { PDF_SERVICE } from '../../application/services/pdf-service.interface';
import { emailProviderFactory } from '../providers/email.provider';
import { HandlebarsCompiler } from './compilers/handlebars-compiler';
import { BrevoRestTransporter } from './transporters/brevo-rest.transporter';
import { EmployeeCredentialsCreatedListener } from '../../application/listeners/employee-credentials-created.listener';
import { PasswordChangedListener } from '../../application/listeners/password-changed.listener';
import { PasswordResetRequestedListener } from '../../application/listeners/password-reset-requested.listener';
import { InvoiceEmailListener } from '../../application/listeners/invoice-email.listener';
import { PdfService } from '../services/pdf.service';

@Module({
  imports: [ConfigModule, CqrsModule],
  providers: [
    HandlebarsCompiler,
    BrevoRestTransporter,
    {
      provide: EMAIL_SERVICE,
      useFactory: emailProviderFactory,
      inject: [ConfigService],
    },
    { provide: PDF_SERVICE, useClass: PdfService },
    EmployeeCredentialsCreatedListener,
    PasswordChangedListener,
    PasswordResetRequestedListener,
    InvoiceEmailListener,
  ],
  exports: [EMAIL_SERVICE, PDF_SERVICE, HandlebarsCompiler, BrevoRestTransporter],
})
export class EmailModule {}
