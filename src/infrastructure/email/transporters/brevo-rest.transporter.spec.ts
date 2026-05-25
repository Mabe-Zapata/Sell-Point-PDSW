import { ConfigService } from '@nestjs/config';
import { BrevoRestTransporter, EmailServiceUnavailableError } from './brevo-rest.transporter';

const mockRequestInterceptor = { use: jest.fn(() => mockRequestInterceptor) };
const mockResponseInterceptor = { use: jest.fn(() => mockResponseInterceptor) };

const mockClient = {
  post: jest.fn(),
  interceptors: {
    request: mockRequestInterceptor,
    response: mockResponseInterceptor,
  },
  defaults: { timeout: 10000 },
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockClient),
}));

jest.mock('axios-retry', () => jest.fn());

describe('BrevoRestTransporter', () => {
  let transporter: BrevoRestTransporter;
  let mockConfigService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, unknown> = {
          'brevo.apiKey': 'test-api-key',
          'brevo.senderEmail': 'test@sellpoint.com',
          'brevo.senderName': 'Sell Point',
        };
        return config[key];
      }),
    };

    transporter = new BrevoRestTransporter(mockConfigService as ConfigService);
  });

  describe('send', () => {
    it('should successfully send email and return messageId', async () => {
      mockClient.post.mockResolvedValueOnce({
        data: { messageId: 'msg-123' },
      });

      const result = await transporter.send('customer@example.com', 'Test Subject', '<html><body>Test</body></html>');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockClient.post).toHaveBeenCalledWith('/v3/smtp/email', expect.objectContaining({
        to: [{ email: 'customer@example.com' }],
        subject: 'Test Subject',
        htmlContent: '<html><body>Test</body></html>',
        sender: { email: 'test@sellpoint.com', name: 'Sell Point' },
      }));
    });

    it('should send email with attachments', async () => {
      mockClient.post.mockResolvedValueOnce({
        data: { messageId: 'msg-456' },
      });

      const pdfBuffer = Buffer.from('PDF content');
      const attachments = [
        { filename: 'invoice.pdf', content: pdfBuffer, mimetype: 'application/pdf' },
      ];

      const result = await transporter.send('customer@example.com', 'Invoice', '<html><body>Invoice</body></html>', attachments);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-456');
      expect(mockClient.post).toHaveBeenCalledWith('/v3/smtp/email', expect.objectContaining({
        attachment: expect.arrayContaining([
          expect.objectContaining({
            filename: 'invoice.pdf',
            content: pdfBuffer.toString('base64'),
            mimetype: 'application/pdf',
          }),
        ]),
      }));
    });

    it('should throw EmailServiceUnavailableError on API error', async () => {
      mockClient.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        transporter.send('customer@example.com', 'Test Subject', '<html><body>Test</body></html>'),
      ).rejects.toThrow(EmailServiceUnavailableError);
    });

    it('should throw EmailServiceUnavailableError on API 503 response', async () => {
      const errorWithStatus = new Error('Service Unavailable') as any;
      errorWithStatus.response = { status: 503, data: { message: 'Service unavailable' } };
      mockClient.post.mockRejectedValueOnce(errorWithStatus);

      await expect(
        transporter.send('customer@example.com', 'Test Subject', '<html><body>Test</body></html>'),
      ).rejects.toThrow(EmailServiceUnavailableError);
    });

    it('should throw EmailServiceUnavailableError for empty recipient', async () => {
      await expect(
        transporter.send('', 'Test Subject', '<html><body>Test</body></html>'),
      ).rejects.toThrow(EmailServiceUnavailableError);
    });

    it('should throw EmailServiceUnavailableError for whitespace-only recipient', async () => {
      await expect(
        transporter.send('   ', 'Test Subject', '<html><body>Test</body></html>'),
      ).rejects.toThrow(EmailServiceUnavailableError);
    });

    it('should throw EmailServiceUnavailableError for null/undefined recipient', async () => {
      await expect(
        transporter.send(null as any, 'Test Subject', '<html><body>Test</body></html>'),
      ).rejects.toThrow(EmailServiceUnavailableError);
    });
  });
});
