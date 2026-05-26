import { ConfigService } from '@nestjs/config';
import { IEmailService } from '../../application/ports/IEmailService';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';
import { EmailServiceAdapter } from '../email/email-service.adapter';
import { HandlebarsCompiler } from '../email/compilers/handlebars-compiler';
import { BrevoRestTransporter } from '../email/transporters/brevo-rest.transporter';
import { LogEmailAdapter } from '../email/log-email.adapter';

export const emailProviderFactory = (configService: ConfigService): IEmailService => {
  const brevoApiKey = configService.get<string>('brevo.apiKey');
  
  // Use real Brevo transporter if API key is configured
  if (brevoApiKey) {
    const compiler = new HandlebarsCompiler();
    const transporter = new BrevoRestTransporter(configService);
    return new EmailServiceAdapter(compiler, transporter);
  }
  
  // Fallback to logging adapter if no API key
  console.warn('[EmailProvider] No Brevo API key configured. Emails will be logged only.');
  return new LogEmailAdapter();
};
