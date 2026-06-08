 
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PasswordChangedListener } from './password-changed.listener';
import { PasswordChangedEvent } from '../../domain/events/password-changed.event';
import type { IEmailService } from '../../application/ports/IEmailService';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';

describe('PasswordChangedListener', () => {
  let listener: PasswordChangedListener;
  let mockEmailService: jest.Mocked<IEmailService>;

  beforeEach(async () => {
    mockEmailService = {
      sendPasswordChangeNotification: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-123' }),
      sendInvoice: jest.fn(),
      sendPasswordReset: jest.fn(),
      sendEmployeeCredentials: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordChangedListener,
        { provide: EMAIL_SERVICE, useValue: mockEmailService },
      ],
    }).compile();

    listener = module.get<PasswordChangedListener>(PasswordChangedListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should call emailService.sendPasswordChangeNotification with correct data', async () => {
      const changedAt = new Date('2026-05-25T10:00:00.000Z');
      const event = new PasswordChangedEvent(
        'user-123',
        'john.doe@example.com',
        'John',
        changedAt,
      );

      await listener.handle(event);

      expect(mockEmailService.sendPasswordChangeNotification).toHaveBeenCalledWith(
        'john.doe@example.com',
        {
          firstName: 'John',
          changedAt: '2026-05-25T10:00:00.000Z',
        },
      );
    });

    it('should NOT throw when emailService.sendPasswordChangeNotification fails (non-fatal)', async () => {
      mockEmailService.sendPasswordChangeNotification.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const event = new PasswordChangedEvent(
        'user-456',
        'jane.doe@example.com',
        'Jane',
        new Date(),
      );

      await expect(listener.handle(event)).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PasswordChangedListener] Failed to send password change notification for user user-456:',
        expect.any(Error),
      );
    });

    it('should log success message when email sent successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const event = new PasswordChangedEvent(
        'user-789',
        'bob.smith@example.com',
        'Bob',
        new Date(),
      );

      await listener.handle(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[PasswordChangedListener] Password change notification sent for user user-789',
      );
    });

    it('should log error when email send returns failure', async () => {
      mockEmailService.sendPasswordChangeNotification.mockResolvedValueOnce({
        success: false,
        error: 'Invalid recipient',
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const event = new PasswordChangedEvent(
        'user-999',
        'bad@example.com',
        'Bad',
        new Date(),
      );

      await listener.handle(event);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PasswordChangedListener] Email send failed: Invalid recipient',
      );
    });
  });
});
