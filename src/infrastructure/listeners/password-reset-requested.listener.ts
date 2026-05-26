/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import type { IEmailService } from '../../application/ports/IEmailService';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';
import { PasswordResetRequestedEvent } from '../../domain/events/password-reset-requested.event';

@EventsHandler(PasswordResetRequestedEvent)
export class PasswordResetRequestedListener implements IEventHandler<PasswordResetRequestedEvent> {
  constructor(
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async handle(event: PasswordResetRequestedEvent): Promise<void> {
    try {
      const expiresInMinutes = Math.max(0, Math.ceil((event.expiresAt.getTime() - Date.now()) / (1000 * 60)));

      const result = await this.emailService.sendPasswordReset(event.email, {
        firstName: event.firstName,
        resetUrl: event.resetUrl,
        expiresInMinutes,
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
