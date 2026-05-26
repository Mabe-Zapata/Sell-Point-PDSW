import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogEmailAdapter } from './log-email.adapter';
import { EmailTemplate } from '../../../application/services/interfaces/email-service.interface';

describe('LogEmailAdapter', () => {
  let adapter: LogEmailAdapter;

  const consoleSpy = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    info: jest.spyOn(console, 'info').mockImplementation(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogEmailAdapter,
      ],
    }).compile();

    adapter = module.get<LogEmailAdapter>(LogEmailAdapter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('send', () => {
    it('should log email details and return success result', async () => {
      const result = await adapter.send(
        'customer@example.com',
        EmailTemplate.ORDER_CONFIRMATION,
        { orderId: 'sale-123', total: 150.00 },
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^log-\d+$/);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[EMAIL] To: customer@example.com, Template: order-confirmation, Data: {"orderId":"sale-123","total":150}',
      );
    });

    it('should log different templates correctly', async () => {
      await adapter.send('test@example.com', EmailTemplate.SALE_CANCELLED, { saleId: '456' });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Template: sale-cancelled'),
      );

      await adapter.send('test@example.com', EmailTemplate.INVOICE, { invoiceId: 'inv-789' });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Template: invoice'),
      );
    });

    it('should return unique messageId on each call', async () => {
      const result1 = await adapter.send('a@example.com', EmailTemplate.ORDER_CONFIRMATION, {});
      const result2 = await adapter.send('b@example.com', EmailTemplate.ORDER_CONFIRMATION, {});

      expect(result1.messageId).not.toBe(result2.messageId);
    });

    it('should handle empty data object', async () => {
      const result = await adapter.send('customer@example.com', EmailTemplate.ORDER_CONFIRMATION, {});
      expect(result.success).toBe(true);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Data: {}'),
      );
    });

    it('should implement IEmailService contract', () => {
      expect(typeof adapter.send).toBe('function');
      expect(adapter.send.length).toBe(3); // to, template, data parameters
    });
  });
});
