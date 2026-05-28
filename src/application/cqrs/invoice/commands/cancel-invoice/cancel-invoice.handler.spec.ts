import { CancelInvoiceCommand } from './cancel-invoice.command';
import { CancelInvoiceHandler } from './cancel-invoice.handler';
import { Invoice, InvoiceStatus } from '../../../../../domain/entities';

describe('CancelInvoiceHandler', () => {
  const mockInvoiceRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  let handler: CancelInvoiceHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new CancelInvoiceHandler(mockInvoiceRepository as any);
  });

  it('should cancel an issued invoice', async () => {
    mockInvoiceRepository.findById.mockResolvedValue(
      new Invoice({
        id: 'inv-1',
        saleId: 'sale-1',
        seriesId: 'series-1',
        invoiceNumber: '001-001-000000001',
        issueDate: new Date(),
        status: InvoiceStatus.ISSUED,
        createdAt: new Date(),
      }),
    );
    mockInvoiceRepository.update.mockResolvedValue(undefined);

    await handler.execute(new CancelInvoiceCommand('inv-1'));

    expect(mockInvoiceRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'inv-1',
        status: InvoiceStatus.CANCELLED,
        cancelledAt: expect.any(Date),
      }),
    );
  });
});
