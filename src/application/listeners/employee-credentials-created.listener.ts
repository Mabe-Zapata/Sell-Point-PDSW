/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import type { IEmailService } from '../ports/IEmailService';
import { EMAIL_SERVICE } from '../ports/email-service.token';
import { EmployeeCredentialsCreatedEvent } from '../../domain/events/employee-credentials-created.event';

@EventsHandler(EmployeeCredentialsCreatedEvent)
export class EmployeeCredentialsCreatedListener implements IEventHandler<EmployeeCredentialsCreatedEvent> {
  constructor(
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    private readonly configService: ConfigService,
  ) {}

  async handle(event: EmployeeCredentialsCreatedEvent): Promise<void> {
    try {
      const loginUrl = this.configService.get<string>('app.url') ??
        this.configService.get<string>('app.frontendUrl') ??
        'http://localhost:3000';

      const result = await this.emailService.sendEmployeeCredentials(event.email, {
        firstName: event.firstName,
        username: event.username,
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
