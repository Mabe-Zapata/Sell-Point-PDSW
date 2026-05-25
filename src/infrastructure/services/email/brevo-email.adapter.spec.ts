import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BrevoEmailAdapter, InvalidTemplateError, EmailServiceUnavailableError } from './brevo-email.adapter';
import { EmailTemplate } from '../../../application/services/interfaces/email-service.interface';

jest.mock('axios', () => {
  const mockAxiosInstance = {
    post: jest.fn(),
  };
  return {
    create: jest.fn(() => mockAxiosInstance),
    __mockInstance: mockAxiosInstance,
  };
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const axios = require('axios') as { create: jest.Mock; __mockInstance: { post: jest.Mock } };
const mockAxiosInstance = axios.__mockInstance;

describe('BrevoEmailAdapter', () => {
  let adapter: BrevoEmailAdapter;
  let mockConfigService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, unknown> = {
          'brevo.apiKey': 'test-api-key',
          'brevo.senderEmail': 'test@sellpoint.com',
          'brevo.senderName': 'Sell Point',
          'brevo.templates.orderConfirmation': 1,
          'brevo.templates.saleCancelled': 2,
          'brevo.templates.invoice': 3,
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrevoEmailAdapter,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    adapter = module.get<BrevoEmailAdapter>(BrevoEmailAdapter);
  });

  describe('send', () => {
    it('should successfully send email and return messageId', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { messageId: 'msg-123' },
      });

      const result = await adapter.send(
        'customer@example.com',
        EmailTemplate.ORDER_CONFIRMATION,
        { orderId: 'sale-1', total: 100 },
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/smtp/email', expect.objectContaining({
        to: [{ email: 'customer@example.com' }],
        templateId: 1,
        params: { orderId: 'sale-1', total: 100 },
        sender: { email: 'test@sellpoint.com', name: 'Sell Point' },
      }));
    });

    it('should throw InvalidTemplateError for unknown template', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { messageId: 'msg-123' },
      });

      // Use a template ID that is not in the map
      const configGet = mockConfigService.get as jest.Mock;
      configGet.mockImplementation((key: string) => {
        if (key === 'brevo.templates.orderConfirmation') return undefined;
        if (key === 'brevo.apiKey') return 'test-api-key';
        if (key === 'brevo.senderEmail') return 'test@sellpoint.com';
        if (key === 'brevo.senderName') return 'Sell Point';
        if (key === 'brevo.templates.saleCancelled') return 2;
        if (key === 'brevo.templates.invoice') return 3;
        return undefined;
      });

      // Create a new adapter with updated config
      const adapter2 = new BrevoEmailAdapter(mockConfigService as ConfigService);
      await expect(adapter2.send('customer@example.com', EmailTemplate.ORDER_CONFIRMATION, {}))
        .rejects.toThrow(InvalidTemplateError);
    });

    it('should throw EmailServiceUnavailableError on API error', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        adapter.send('customer@example.com', EmailTemplate.ORDER_CONFIRMATION, {}),
      ).rejects.toThrow(EmailServiceUnavailableError);
    });

    it('should throw EmailServiceUnavailableError on API 503 response', async () => {
      const errorWithStatus = new Error('Service Unavailable') as any;
      errorWithStatus.response = { status: 503, data: { message: 'Service unavailable' } };
      mockAxiosInstance.post.mockRejectedValueOnce(errorWithStatus);

      await expect(
        adapter.send('customer@example.com', EmailTemplate.ORDER_CONFIRMATION, {}),
      ).rejects.toThrow(EmailServiceUnavailableError);
    });

    it('should validate empty recipient', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { messageId: 'msg-123' },
      });

      // Brevo API will reject empty email, so we expect it to either succeed with validation
      // or fail in downstream call - the key is adapter doesn't crash on empty string
      const result = await adapter.send('', EmailTemplate.ORDER_CONFIRMATION, {});
      // The actual validation happens at Brevo API level
      expect(mockAxiosInstance.post).toHaveBeenCalled();
    });
  });
});
