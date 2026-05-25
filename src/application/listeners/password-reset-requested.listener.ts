/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import type { IEmailService } from '../ports/IEmailService';
import { EMAIL_SERVICE } from '../ports/email-service.token';
import { PasswordResetRequestedEvent } from '../../domain/events/password-reset-requested.event';

@EventsHandler(PasswordResetRequestedEvent)
export class PasswordResetRequestedListener implements IEventHandler<PasswordResetRequestedEvent> {
  constructor(
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async handle(event: PasswordResetRequestedEvent): Promise<void> {
    try {
      const expiresInHours = Math.round((event.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));

      const result = await this.emailService.sendPasswordReset(event.email, {
        firstName: event.firstName,
        resetUrl: event.resetUrl,
        expiresInHours: expiresInHours > 0 ? expiresInHours : 0,
      });

      if (!result.success) {
        console.error(`[PasswordResetRequestedListener] Email send failed: ${result.error}`);
      } else {
        console.info(
          `[PasswordResetRequestedListener] Password reset email sent for user ${event.userId}`,
        );
      }
    } catch (error) {
      console.error(
        `[PasswordResetRequestedListener] Failed to send password reset email for user ${event.userId}:`,
        error,
      );
    }
  }
}
