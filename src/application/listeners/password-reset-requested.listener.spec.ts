/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PasswordResetRequestedListener } from './password-reset-requested.listener';
import { PasswordResetRequestedEvent } from '../../domain/events/password-reset-requested.event';
import type { IEmailService } from '../ports/IEmailService';
import { EMAIL_SERVICE } from '../ports/email-service.token';

describe('PasswordResetRequestedListener', () => {
  let listener: PasswordResetRequestedListener;
  let mockEmailService: jest.Mocked<IEmailService>;

  beforeEach(async () => {
    mockEmailService = {
      sendPasswordReset: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-123' }),
      sendInvoice: jest.fn(),
      sendEmployeeCredentials: jest.fn(),
      sendPasswordChangeNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetRequestedListener,
        { provide: EMAIL_SERVICE, useValue: mockEmailService },
      ],
    }).compile();

    listener = module.get<PasswordResetRequestedListener>(PasswordResetRequestedListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should call emailService.sendPasswordReset with correct data', async () => {
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      const event = new PasswordResetRequestedEvent(
        'user-123',
        'john.doe@example.com',
        'John',
        'reset-token-abc123',
        'https://app.example.com/reset-password?token=abc123',
        expiresAt,
      );

      await listener.handle(event);

      expect(mockEmailService.sendPasswordReset).toHaveBeenCalledWith(
        'john.doe@example.com',
        {
          firstName: 'John',
          resetUrl: 'https://app.example.com/reset-password?token=abc123',
          expiresInHours: 2,
        },
      );
    });

    it('should handle expired token (negative hours as 0)', async () => {
      const expiredAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago (expired)
      const event = new PasswordResetRequestedEvent(
        'user-456',
        'jane.doe@example.com',
        'Jane',
        'expired-token',
        'https://app.example.com/reset-password?token=expired',
        expiredAt,
      );

      await listener.handle(event);

      expect(mockEmailService.sendPasswordReset).toHaveBeenCalledWith(
        'jane.doe@example.com',
        expect.objectContaining({ expiresInHours: 0 }),
      );
    });

    it('should NOT throw when emailService.sendPasswordReset fails (non-fatal)', async () => {
      mockEmailService.sendPasswordReset.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const event = new PasswordResetRequestedEvent(
        'user-789',
        'bob.smith@example.com',
        'Bob',
        'token-789',
        'https://app.example.com/reset?token=789',
        new Date(Date.now() + 60 * 60 * 1000),
      );

      await expect(listener.handle(event)).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PasswordResetRequestedListener] Failed to send password reset email for user user-789:',
        expect.any(Error),
      );
    });

    it('should log success message when email sent successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const event = new PasswordResetRequestedEvent(
        'user-111',
        'alice@example.com',
        'Alice',
        'token-111',
        'https://app.example.com/reset?token=111',
        new Date(Date.now() + 60 * 60 * 1000),
      );

      await listener.handle(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PasswordResetRequestedListener] Password reset email sent for user user-111',
      );
    });

    it('should log error when email send returns failure', async () => {
      mockEmailService.sendPasswordReset.mockResolvedValueOnce({
        success: false,
        error: 'Rate limited',
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const event = new PasswordResetRequestedEvent(
        'user-222',
        'rate@example.com',
        'Rate',
        'token-222',
        'https://app.example.com/reset?token=222',
        new Date(Date.now() + 60 * 60 * 1000),
      );

      await listener.handle(event);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PasswordResetRequestedListener] Email send failed: Rate limited',
      );
    });
  });
});
