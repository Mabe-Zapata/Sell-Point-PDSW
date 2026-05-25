import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';
import { emailProviderFactory } from '../providers/email.provider';
import { HandlebarsCompiler } from './compilers/handlebars-compiler';
import { BrevoRestTransporter } from './transporters/brevo-rest.transporter';

@Module({
  imports: [ConfigModule],
  providers: [
    HandlebarsCompiler,
    BrevoRestTransporter,
    {
      provide: EMAIL_SERVICE,
      useFactory: emailProviderFactory,
      inject: [ConfigService],
    },
  ],
  exports: [EMAIL_SERVICE, HandlebarsCompiler, BrevoRestTransporter],
})
export class EmailModule {}
