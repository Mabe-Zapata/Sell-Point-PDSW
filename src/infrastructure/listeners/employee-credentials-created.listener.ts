import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import type { IEmailService } from '../../application/ports/IEmailService';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';
import { EmployeeCredentialsCreatedEvent } from '../../domain/events/employee-credentials-created.event';

@EventsHandler(EmployeeCredentialsCreatedEvent)
export class EmployeeCredentialsCreatedListener implements IEventHandler<EmployeeCredentialsCreatedEvent> {
  constructor(
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    private readonly configService: ConfigService,
  ) {}

  async handle(event: EmployeeCredentialsCreatedEvent): Promise<void> {
    try {
      const frontendBaseUrl = this.configService.get<string>('app.frontendBaseUrl') ??
        this.configService.get<string>('app.url') ??
        'http://localhost:4321';
      const loginUrl = `${frontendBaseUrl}/auth`;

      const result = await this.emailService.sendEmployeeCredentials(event.email, {
        firstName: event.firstName,
        username: event.username,
        email: event.email,
        temporaryPassword: event.temporaryPassword,
        loginUrl,
      });

      if (!result.success) {
        console.error(`[EmployeeCredentialsCreatedListener] Email send failed: ${result.error}`);
      } else {
        console.info(
          `[EmployeeCredentialsCreatedListener] Credentials sent for employee ${event.employeeId}`,
        );
      }
    } catch (error) {
      console.error(
        `[EmployeeCredentialsCreatedListener] Failed to send credentials for employee ${event.employeeId}:`,
        error,
      );
    }
  }
}
