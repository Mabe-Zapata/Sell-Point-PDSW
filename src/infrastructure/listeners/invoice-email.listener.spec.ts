/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceEmailListener } from './invoice-email.listener';
import { SaleConfirmedEvent } from '../../domain/events/sale-confirmed.event';
import type { IEmailService } from '../../application/ports/IEmailService';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';
import type { IPdfService } from '../../application/services/pdf-service.interface';
import { PDF_SERVICE } from '../../application/services/pdf-service.interface';

describe('InvoiceEmailListener', () => {
  let listener: InvoiceEmailListener;
  let mockEmailService: jest.Mocked<IEmailService>;
  let mockPdfService: jest.Mocked<IPdfService>;

  beforeEach(async () => {
    mockEmailService = {
      sendInvoice: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-123' }),
      sendPasswordReset: jest.fn(),
      sendEmployeeCredentials: jest.fn(),
      sendPasswordChangeNotification: jest.fn(),
    };

    mockPdfService = {
      generateInvoicePdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf-content')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceEmailListener,
        { provide: EMAIL_SERVICE, useValue: mockEmailService },
        { provide: PDF_SERVICE, useValue: mockPdfService },
      ],
    }).compile();

    listener = module.get<InvoiceEmailListener>(InvoiceEmailListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should NOT call emailService when invoiceId is absent', async () => {
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
          },
        ],
      );

      await listener.handle(event);

      expect(mockPdfService.generateInvoicePdf).not.toHaveBeenCalled();
      expect(mockEmailService.sendInvoice).not.toHaveBeenCalled();
    });

    it('should call emailService.sendInvoice with PDF when invoiceId is present', async () => {
      const event = new SaleConfirmedEvent(
        'sale-123',
        new Date('2026-05-25'),
        150.00,
        'customer@example.com',
        'John Doe',
        [
          {
            productId: 'prod-1',
            productName: 'Product 1',
            quantity: 2,
            unitPrice: 50.00,
          },
          {
            productId: 'prod-2',
            productName: 'Product 2',
            quantity: 1,
            unitPrice: 50.00,
          },
        ],
        'invoice-456',
      );

      await listener.handle(event);

      expect(mockPdfService.generateInvoicePdf).toHaveBeenCalled();
      expect(mockEmailService.sendInvoice).toHaveBeenCalledWith(
        'customer@example.com',
        'invoice-456',
        expect.objectContaining({
          invoiceNumber: 'invoice-456',
          customerName: 'John Doe',
          items: expect.arrayContaining([
            expect.objectContaining({ description: 'Product 1', quantity: 2 }),
          ]),
          total: 150.00,
        }),
      );
    });

    it('should log success message when invoice email sent successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const event = new SaleConfirmedEvent(
        'sale-789',
        new Date(),
        200.00,
        'test@example.com',
        'Test User',
        [],
        'invoice-789',
      );

      await listener.handle(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[InvoiceEmailListener] Invoice email sent for sale sale-789, invoice invoice-789',
      );
    });

    it('should NOT throw when emailService.sendInvoice fails (non-fatal)', async () => {
      mockEmailService.sendInvoice.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const event = new SaleConfirmedEvent(
        'sale-456',
        new Date(),
        100.00,
        'bad@example.com',
        'Bad Customer',
        [],
        'invoice-456',
      );

      await expect(listener.handle(event)).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[InvoiceEmailListener] Failed to send invoice email for sale sale-456:',
        expect.any(Error),
      );
    });

    it('should NOT throw when pdfService.generateInvoicePdf fails (non-fatal)', async () => {
      mockPdfService.generateInvoicePdf.mockRejectedValueOnce(new Error('PDF generation failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const event = new SaleConfirmedEvent(
        'sale-999',
        new Date(),
        75.00,
        'pdf-fail@example.com',
        'PDF Fail',
        [],
        'invoice-999',
      );

      await expect(listener.handle(event)).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[InvoiceEmailListener] Failed to send invoice email for sale sale-999:',
        expect.any(Error),
      );
    });

    it('should log error when email send returns failure result', async () => {
      mockEmailService.sendInvoice.mockResolvedValueOnce({
        success: false,
        error: 'Invalid email address',
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const event = new SaleConfirmedEvent(
        'sale-555',
        new Date(),
        300.00,
        'invalid@example.com',
        'Invalid Customer',
        [],
        'invoice-555',
      );

      await listener.handle(event);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[InvoiceEmailListener] Email send failed: Invalid email address',
      );
    });
  });
});
