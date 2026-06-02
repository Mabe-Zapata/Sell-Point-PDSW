import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceEmailListener } from './invoice-email.listener';
import { InvoiceIssuedEvent } from '../../domain/events/invoice-issued.event';
import type { IEmailService } from '../../application/ports/IEmailService';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';
import type { IPdfService } from '../../application/services/pdf-service.interface';
import { PDF_SERVICE } from '../../application/services/pdf-service.interface';
import { INVOICE_QUERY_SERVICE } from '../../application/query-tokens';
import { INVOICE_ITEM_REPOSITORY } from '../common/injection-tokens';
import type { IInvoiceQueryService } from '../../domain/query-services/invoice.query-service.interface';
import type { IInvoiceItemRepository } from '../../domain/repositories';

describe('InvoiceEmailListener', () => {
  let listener: InvoiceEmailListener;
  let mockEmailService: jest.Mocked<IEmailService>;
  let mockPdfService: jest.Mocked<IPdfService>;
  let mockInvoiceQueryService: jest.Mocked<IInvoiceQueryService>;
  let mockInvoiceItemRepository: jest.Mocked<IInvoiceItemRepository>;

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

    mockInvoiceQueryService = {
      listInvoices: jest.fn(),
      getInvoiceBySaleId: jest.fn(),
      getInvoiceById: jest.fn().mockResolvedValue({
        id: 'inv-456',
        saleId: 'sale-123',
        seriesId: 'series-1',
        invoiceNumber: '001-002-000000015',
        authorizationNumber: null,
        issueDate: new Date('2026-05-25'),
        status: 'ISSUED',
        cancelledAt: null,
        createdAt: new Date('2026-05-25'),
        saleNumber: 'SAL-1',
        customerName: 'John Doe',
        customerCedula: '1234567890',
        customerEmail: 'customer@example.com',
        subtotal: 130.43,
        iva: 19.57,
        total: 150,
        establishmentCode: '001',
        emissionPointCode: '002',
      }),
    };

    mockInvoiceItemRepository = {
      createMany: jest.fn(),
      findByInvoiceId: jest.fn().mockResolvedValue([
        {
          id: 'item-1',
          invoiceId: 'inv-456',
          productId: 'prod-1',
          productName: 'Product 1',
          quantity: 2,
          unitPrice: 50,
          subtotal: 100,
          taxRateId: 'tax-15',
          taxPercentage: 15,
          taxAmount: 15,
          total: 115,
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceEmailListener,
        { provide: EMAIL_SERVICE, useValue: mockEmailService },
        { provide: PDF_SERVICE, useValue: mockPdfService },
        { provide: INVOICE_QUERY_SERVICE, useValue: mockInvoiceQueryService },
        { provide: INVOICE_ITEM_REPOSITORY, useValue: mockInvoiceItemRepository },
      ],
    }).compile();

    listener = module.get<InvoiceEmailListener>(InvoiceEmailListener);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should call emailService.sendInvoice with PDF when event is received', async () => {
      const event = new InvoiceIssuedEvent(
        'inv-456',
        'sale-123',
        '001-002-000000015',
        'customer@example.com',
        'John Doe',
        new Date('2026-05-25'),
        150.00,
        130.43,
        19.57,
        [
          { productId: 'prod-1', productName: 'Product 1', quantity: 2, unitPrice: 50.00, subtotal: 100.00 },
          { productId: 'prod-2', productName: 'Product 2', quantity: 1, unitPrice: 50.00, subtotal: 50.00 },
        ],
      );

      await listener.handle(event);

      expect(mockInvoiceQueryService.getInvoiceById).toHaveBeenCalledWith('inv-456');
      expect(mockInvoiceItemRepository.findByInvoiceId).toHaveBeenCalledWith('inv-456');
      expect(mockPdfService.generateInvoicePdf).toHaveBeenCalled();
      expect(mockEmailService.sendInvoice).toHaveBeenCalledWith(
        'customer@example.com',
        'inv-456',
        expect.objectContaining({
          invoiceNumber: '001-002-000000015',
          customerName: 'John Doe',
          customerCedula: '1234567890',
          includeTaxBreakdown: true,
          items: expect.arrayContaining([
            expect.objectContaining({ description: 'Product 1', quantity: 2 }),
          ]),
          total: 150.00,
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: 'factura-001-002-000000015.pdf',
              mimetype: 'application/pdf',
            }),
          ]),
        }),
      );
    });

    it('should log success message when invoice email sent successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      const event = new InvoiceIssuedEvent(
        'inv-789',
        'sale-789',
        '001-001-000000001',
        'test@example.com',
        'Test User',
        new Date(),
        200.00,
        173.91,
        26.09,
        [],
      );
      mockInvoiceQueryService.getInvoiceById.mockResolvedValueOnce({
        id: 'inv-789',
        saleId: 'sale-789',
        seriesId: 'series-1',
        invoiceNumber: '001-001-000000001',
        authorizationNumber: null,
        issueDate: new Date(),
        status: 'ISSUED',
        cancelledAt: null,
        createdAt: new Date(),
        saleNumber: 'SAL-789',
        customerName: 'Test User',
        customerCedula: '',
        customerEmail: 'test@example.com',
        subtotal: 173.91,
        iva: 26.09,
        total: 200,
        establishmentCode: '001',
        emissionPointCode: '001',
      });

      await listener.handle(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[InvoiceEmailListener] Invoice email sent for sale sale-789, invoice inv-789',
      );
    });

    it('should NOT throw when emailService.sendInvoice fails (non-fatal)', async () => {
      mockEmailService.sendInvoice.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const event = new InvoiceIssuedEvent(
        'inv-456',
        'sale-456',
        '001-001-000000002',
        'bad@example.com',
        'Bad Customer',
        new Date(),
        100.00,
        86.96,
        13.04,
        [],
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
      const event = new InvoiceIssuedEvent(
        'inv-999',
        'sale-999',
        '001-001-000000003',
        'pdf-fail@example.com',
        'PDF Fail',
        new Date(),
        75.00,
        65.22,
        9.78,
        [],
      );
      mockInvoiceQueryService.getInvoiceById.mockResolvedValueOnce({
        id: 'inv-999',
        saleId: 'sale-999',
        seriesId: 'series-1',
        invoiceNumber: '001-001-000000003',
        authorizationNumber: null,
        issueDate: new Date(),
        status: 'ISSUED',
        cancelledAt: null,
        createdAt: new Date(),
        saleNumber: 'SAL-999',
        customerName: 'PDF Fail',
        customerCedula: '',
        customerEmail: 'pdf-fail@example.com',
        subtotal: 65.22,
        iva: 9.78,
        total: 75,
        establishmentCode: '001',
        emissionPointCode: '001',
      });

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
      const event = new InvoiceIssuedEvent(
        'inv-555',
        'sale-555',
        '001-001-000000004',
        'invalid@example.com',
        'Invalid Customer',
        new Date(),
        300.00,
        260.87,
        39.13,
        [],
      );
      mockInvoiceQueryService.getInvoiceById.mockResolvedValueOnce({
        id: 'inv-555',
        saleId: 'sale-555',
        seriesId: 'series-1',
        invoiceNumber: '001-001-000000004',
        authorizationNumber: null,
        issueDate: new Date(),
        status: 'ISSUED',
        cancelledAt: null,
        createdAt: new Date(),
        saleNumber: 'SAL-555',
        customerName: 'Invalid Customer',
        customerCedula: '',
        customerEmail: 'invalid@example.com',
        subtotal: 260.87,
        iva: 39.13,
        total: 300,
        establishmentCode: '001',
        emissionPointCode: '001',
      });

      await listener.handle(event);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[InvoiceEmailListener] Email send failed: Invalid email address',
      );
    });

    it('should skip email when persisted invoice cannot be found', async () => {
      mockInvoiceQueryService.getInvoiceById.mockResolvedValueOnce(null);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const event = new InvoiceIssuedEvent(
        'missing-inv',
        'sale-missing',
        '001-001-000000005',
        'missing@example.com',
        'Missing Customer',
        new Date(),
        10,
        8.7,
        1.3,
        [],
      );

      await listener.handle(event);

      expect(mockPdfService.generateInvoicePdf).not.toHaveBeenCalled();
      expect(mockEmailService.sendInvoice).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[InvoiceEmailListener] Invoice missing-inv not found for email',
      );
    });
  });
});
