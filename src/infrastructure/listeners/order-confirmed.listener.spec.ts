/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { OrderConfirmedListener } from './order-confirmed.listener';
import { SaleConfirmedEvent } from '../../domain/events/sale-confirmed.event';
import type { IEmailService } from '../../application/ports/IEmailService';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';

describe('OrderConfirmedListener', () => {
  let listener: OrderConfirmedListener;
  let mockEmailService: jest.Mocked<IEmailService>;

  beforeEach(async () => {
    mockEmailService = {
      sendInvoice: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-123' }),
      sendPasswordReset: jest.fn(),
      sendEmployeeCredentials: jest.fn(),
      sendPasswordChangeNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderConfirmedListener,
        { provide: EMAIL_SERVICE, useValue: mockEmailService },
      ],
    }).compile();

    listener = module.get<OrderConfirmedListener>(OrderConfirmedListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should call emailService.sendInvoice on SaleConfirmedEvent', async () => {
      const event = new SaleConfirmedEvent(
        'sale-123',
        new Date(),
        150.00,
        'customer@example.com',
        'John Doe',
        [
          {
            productId: 'prod-1',
            productName: 'Product 1',
            quantity: 2,
            unitPrice: 50.00,
            subtotal: 100.00,
          },
          {
            productId: 'prod-2',
            productName: 'Product 2',
            quantity: 1,
            unitPrice: 50.00,
            subtotal: 50.00,
          },
        ],
      );

      await listener.handle(event);

      expect(mockEmailService.sendInvoice).toHaveBeenCalledWith(
        'customer@example.com',
        'sale-123',
        expect.objectContaining({
          invoiceNumber: 'sale-123',
          customerName: 'John Doe',
          items: expect.arrayContaining([
            expect.objectContaining({ description: 'Product 1' }),
          ]),
          total: 150.00,
        }),
      );
    });

    it('should log success message when email sent successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const event = new SaleConfirmedEvent(
        'sale-123',
        new Date(),
        100.00,
        'customer@example.com',
        'Jane Doe',
        [],
      );

      await listener.handle(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[OrderConfirmedListener] Order confirmation sent for sale sale-123',
      );
    });

    it('should NOT throw when emailService.sendInvoice fails (non-fatal)', async () => {
      mockEmailService.sendInvoice.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const event = new SaleConfirmedEvent(
        'sale-456',
        new Date(),
        200.00,
        'bad-customer@example.com',
        'Bad Customer',
        [],
      );

      // Should not throw - email is non-critical path
      await expect(listener.handle(event)).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[OrderConfirmedListener] Failed to send order confirmation for sale sale-456:',
        expect.any(Error),
      );
    });

    it('should handle event without details gracefully', async () => {
      const event = new SaleConfirmedEvent(
        'sale-789',
        new Date(),
        50.00,
        'test@example.com',
        'Test User',
        [],
      );

      await listener.handle(event);

      expect(mockEmailService.sendInvoice).toHaveBeenCalledWith(
        'test@example.com',
        'sale-789',
        expect.objectContaining({
          invoiceNumber: 'sale-789',
          items: [],
        }),
      );
    });
  });
});
