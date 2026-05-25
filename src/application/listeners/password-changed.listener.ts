/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import type { IEmailService } from '../ports/IEmailService';
import { EMAIL_SERVICE } from '../ports/email-service.token';
import { PasswordChangedEvent } from '../../domain/events/password-changed.event';

@EventsHandler(PasswordChangedEvent)
export class PasswordChangedListener implements IEventHandler<PasswordChangedEvent> {
  constructor(
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async handle(event: PasswordChangedEvent): Promise<void> {
    try {
      const result = await this.emailService.sendPasswordChangeNotification(event.email, {
        firstName: event.firstName,
        changedAt: event.changedAt.toISOString(),
      });

      if (!result.success) {
        console.error(`[PasswordChangedListener] Email send failed: ${result.error}`);
      } else {
        console.info(
          `[PasswordChangedListener] Password change notification sent for user ${event.userId}`,
        );
      }
    } catch (error) {
      console.error(
        `[PasswordChangedListener] Failed to send password change notification for user ${event.userId}:`,
        error,
      );
    }
  }
}
