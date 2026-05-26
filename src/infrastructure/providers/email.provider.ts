import { ConfigService } from '@nestjs/config';
import { IEmailService } from '../../application/services/interfaces/email-service.interface';
import { BrevoEmailAdapter } from '../services/email/brevo-email.adapter';
import { LogEmailAdapter } from '../services/email/log-email.adapter';

export const emailProviderFactory = (configService: ConfigService): IEmailService => {
  const nodeEnv = configService.get<string>('app.mode');
  if (nodeEnv === 'production') {
    return new BrevoEmailAdapter(configService);
  }
  return new LogEmailAdapter();
};