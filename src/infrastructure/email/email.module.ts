import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';
import { PDF_SERVICE } from '../../application/services/pdf-service.interface';
import { emailProviderFactory } from '../providers/email.provider';
import { HandlebarsCompiler } from './compilers/handlebars-compiler';
import { BrevoRestTransporter } from './transporters/brevo-rest.transporter';
import {
  EmployeeCredentialsCreatedListener,
  PasswordChangedListener,
  PasswordResetRequestedListener,
} from '../listeners';
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
  ],
  exports: [EMAIL_SERVICE, PDF_SERVICE, HandlebarsCompiler, BrevoRestTransporter],
})
export class EmailModule {}
