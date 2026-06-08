import { CreateInvoiceCommand } from './create-invoice.command';
import { CreateInvoiceHandler } from './create-invoice.handler';
import { DuplicateInvoiceForSaleException } from '../../../../../domain/exceptions';
import { InvoiceStatus } from '../../../../../domain/entities';

describe('CreateInvoiceHandler', () => {
  const mockInvoiceRepository = {
    create: jest.fn(),
    update: jest.fn(),
    findBySaleId: jest.fn().mockResolvedValue(null),
  };

  const mockInvoiceItemRepository = {
    createMany: jest.fn(),
  };

  const mockInvoiceSeriesRepository = {
    findActiveByBranchId: jest.fn(),
    incrementSequence: jest.fn(),
  };

  const mockSaleDetailRepository = {
    findBySaleId: jest.fn(),
  };

  let handler: CreateInvoiceHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new CreateInvoiceHandler(
      mockInvoiceRepository as any,
      mockInvoiceItemRepository as any,
      mockInvoiceSeriesRepository as any,
      mockSaleDetailRepository as any,
    );
  });

  it('should create invoice with sequential number and totals from persisted sale details', async () => {
    mockInvoiceSeriesRepository.findActiveByBranchId.mockResolvedValue({
      id: 'series-1',
      establishmentCode: '001',
      emissionPointCode: '002',
    });
    mockInvoiceSeriesRepository.incrementSequence.mockResolvedValue(15);
    mockSaleDetailRepository.findBySaleId.mockResolvedValue([
      {
        productId: 'prod-1',
        productName: 'Prod 1',
        quantity: 2,
        unitPrice: 10,
        taxRateId: 'tax-15',
        taxPercentage: 15,
        taxAmount: 3,
      },
      {
        productId: 'prod-2',
        productName: 'Prod 2',
        quantity: 1,
        unitPrice: 20,
        taxRateId: 'tax-15',
        taxPercentage: 15,
        taxAmount: 3,
      },
    ]);
    mockInvoiceRepository.create.mockImplementation(async (invoice) => ({
      ...invoice,
      createdAt: new Date('2026-05-27T00:00:00.000Z'),
    }));
    mockInvoiceRepository.update.mockImplementation(async (invoice) => invoice);
    mockInvoiceItemRepository.createMany.mockImplementation(async (items) => items);

    const result = await handler.execute(
      new CreateInvoiceCommand('sale-1', 'branch-1'),
    );

    expect(mockSaleDetailRepository.findBySaleId).toHaveBeenCalledWith('sale-1');
    expect(mockInvoiceSeriesRepository.findActiveByBranchId).toHaveBeenCalledWith('branch-1');
    expect(mockInvoiceSeriesRepository.incrementSequence).toHaveBeenCalledWith('series-1');
    expect(mockInvoiceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        saleId: 'sale-1',
        seriesId: 'series-1',
        invoiceNumber: '001-002-000000015',
        status: InvoiceStatus.ISSUED,
      }),
    );
    expect(mockInvoiceItemRepository.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'prod-1',
          productName: 'Prod 1',
          taxRateId: 'tax-15',
          taxPercentage: 15,
          taxAmount: 3,
        }),
      ]),
    );
    expect(result.invoiceNumber).toBe('001-002-000000015');
    expect(result.subtotal).toBe(40);
    expect(result.iva).toBe(6);
    expect(result.total).toBe(46);
    expect(result).not.toHaveProperty('profitTotal');
  });

  it('should throw DuplicateInvoiceForSaleException when invoice already exists', async () => {
    mockInvoiceRepository.findBySaleId.mockResolvedValueOnce({ id: 'inv-1' });

    await expect(
      handler.execute(
        new CreateInvoiceCommand('sale-1', 'branch-1'),
      ),
    ).rejects.toThrow(DuplicateInvoiceForSaleException);
  });
});
