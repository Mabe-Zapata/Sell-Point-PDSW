import { Inject, Optional } from '@nestjs/common';
import type { IErrorLogRepository } from '../../domain/repositories';
import { ERROR_LOG_REPOSITORY } from '../common/injection-tokens';
import { ErrorLog } from '../../domain/entities';
import { ExceptionType } from '../../domain/entities/enums';
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
    @Optional()
    @Inject(ERROR_LOG_REPOSITORY)
    private readonly errorLogRepository?: IErrorLogRepository,
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
      const message = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;
      console.error(
        `[EmployeeCredentialsCreatedListener] Failed to send credentials for employee ${event.employeeId}:`,
        error,
      );
      if (this.errorLogRepository) {
        const errorLog = new ErrorLog({
          exceptionType: ExceptionType.EXTERNAL_SERVICE_ERROR,
          message,
          stackTrace,
          source: 'EmployeeCredentialsCreatedListener',
        });
        this.errorLogRepository.create(errorLog).catch(() => undefined);
      }
    }
  }
}
