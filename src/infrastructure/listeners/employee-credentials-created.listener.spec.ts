/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmployeeCredentialsCreatedListener } from './employee-credentials-created.listener';
import { EmployeeCredentialsCreatedEvent } from '../../domain/events/employee-credentials-created.event';
import type { IEmailService } from '../../application/ports/IEmailService';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';

describe('EmployeeCredentialsCreatedListener', () => {
  let listener: EmployeeCredentialsCreatedListener;
  let mockEmailService: jest.Mocked<IEmailService>;

  beforeEach(async () => {
    mockEmailService = {
      sendEmployeeCredentials: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-123' }),
      sendInvoice: jest.fn(),
      sendPasswordReset: jest.fn(),
      sendPasswordChangeNotification: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'app.url') return 'https://app.example.com';
        if (key === 'app.frontendUrl') return 'https://frontend.example.com';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeCredentialsCreatedListener,
        { provide: EMAIL_SERVICE, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    listener = module.get<EmployeeCredentialsCreatedListener>(EmployeeCredentialsCreatedListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should call emailService.sendEmployeeCredentials with correct data', async () => {
      const event = new EmployeeCredentialsCreatedEvent(
        'emp-123',
        'jdoe',
        'john.doe@example.com',
        'TempPass123!',
        'John',
      );

      await listener.handle(event);

      expect(mockEmailService.sendEmployeeCredentials).toHaveBeenCalledWith(
        'john.doe@example.com',
        {
          firstName: 'John',
          username: 'jdoe',
          email: 'john.doe@example.com',
          temporaryPassword: 'TempPass123!',
          loginUrl: 'https://app.example.com/login',
        },
      );
    });

    it('should fall back to frontendUrl when app.url is not set', async () => {
      const mockConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'app.url') return null;
          if (key === 'app.frontendBaseUrl') return 'https://fallback.example.com';
          return null;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmployeeCredentialsCreatedListener,
          { provide: EMAIL_SERVICE, useValue: mockEmailService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const fallbackListener = module.get<EmployeeCredentialsCreatedListener>(EmployeeCredentialsCreatedListener);
      const event = new EmployeeCredentialsCreatedEvent(
        'emp-456',
        'asmith',
        'alice.smith@example.com',
        'TempPass456!',
        'Alice',
      );

      await fallbackListener.handle(event);

      expect(mockEmailService.sendEmployeeCredentials).toHaveBeenCalledWith(
        'alice.smith@example.com',
        expect.objectContaining({ loginUrl: 'https://fallback.example.com/login' }),
      );
    });

    it('should fall back to localhost when no config is set', async () => {
      const mockConfigService = {
        get: jest.fn().mockReturnValue(null),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmployeeCredentialsCreatedListener,
          { provide: EMAIL_SERVICE, useValue: mockEmailService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const localhostListener = module.get<EmployeeCredentialsCreatedListener>(EmployeeCredentialsCreatedListener);
      const event = new EmployeeCredentialsCreatedEvent(
        'emp-789',
        'bwilson',
        'bob.wilson@example.com',
        'TempPass789!',
        'Bob',
      );

      await localhostListener.handle(event);

      expect(mockEmailService.sendEmployeeCredentials).toHaveBeenCalledWith(
        'bob.wilson@example.com',
        expect.objectContaining({ loginUrl: 'http://localhost:5173/login' }),
      );
    });

    it('should NOT throw when emailService.sendEmployeeCredentials fails (non-fatal)', async () => {
      mockEmailService.sendEmployeeCredentials.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const event = new EmployeeCredentialsCreatedEvent(
        'emp-999',
        'cfailed',
        'charlie.failed@example.com',
        'TempPass999!',
        'Charlie',
      );

      await expect(listener.handle(event)).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[EmployeeCredentialsCreatedListener] Failed to send credentials for employee emp-999:',
        expect.any(Error),
      );
    });

    it('should log success message when email sent successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const event = new EmployeeCredentialsCreatedEvent(
        'emp-111',
        'jsuccess',
        'jane.success@example.com',
        'TempPass111!',
        'Jane',
      );

      await listener.handle(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[EmployeeCredentialsCreatedListener] Credentials sent for employee emp-111',
      );
    });
  });
});
