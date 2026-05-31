/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Optional } from '@nestjs/common';
import type { IErrorLogRepository } from '../../domain/repositories';
import { ERROR_LOG_REPOSITORY } from '../common/injection-tokens';
import { ErrorLog } from '../../domain/entities';
import { ExceptionType } from '../../domain/entities/enums';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import type { IEmailService } from '../../application/ports/IEmailService';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';
import { PasswordChangedEvent } from '../../domain/events/password-changed.event';

@EventsHandler(PasswordChangedEvent)
export class PasswordChangedListener implements IEventHandler<PasswordChangedEvent> {
  constructor(
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    @Optional()
    @Inject(ERROR_LOG_REPOSITORY)
    private readonly errorLogRepository?: IErrorLogRepository,
  ) {}

  async handle(event: PasswordChangedEvent): Promise<void> {
    try {
      const result = await this.emailService.sendPasswordChangeNotification(event.email, {
        firstName: event.firstName,
        changedAt: event.changedAt.toISOString(),
        ip: event.ip,
        userAgent: event.userAgent,
        requestedIp: event.resetRequestedIp,
        requestedUserAgent: event.resetRequestedUserAgent,
      });

      if (!result.success) {
        console.error(`[PasswordChangedListener] Email send failed: ${result.error}`);
      } else {
        console.info(
          `[PasswordChangedListener] Password change notification sent for user ${event.userId}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;
      console.error(
        `[PasswordChangedListener] Failed to send password change notification for user ${event.userId}:`,
        error,
      );
      if (this.errorLogRepository) {
        const errorLog = new ErrorLog({
          exceptionType: ExceptionType.EXTERNAL_SERVICE_ERROR,
          message,
          stackTrace,
          source: 'PasswordChangedListener',
        });
        this.errorLogRepository.create(errorLog).catch(() => undefined);
      }
    }
  }
}
