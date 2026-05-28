import { EventBus } from '@nestjs/cqrs';
import { CreateInvoiceCommand } from '../../../../../application/cqrs/invoice/commands/create-invoice/create-invoice.command';
import { CreateInvoiceHandler } from './CreateInvoiceHandler';

describe('Infrastructure CreateInvoiceHandler', () => {
  const mockInvoiceRepository = {
    findBySaleId: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
  };
  const mockInvoiceItemRepository = {
    createMany: jest.fn().mockResolvedValue([]),
  };
  const mockInvoiceSeriesRepository = {
    findActiveByBranchId: jest.fn().mockResolvedValue({
      id: 'series-1',
      establishmentCode: '001',
      emissionPointCode: '001',
    }),
    incrementSequence: jest.fn().mockResolvedValue(1),
  };
  const mockSaleDetailRepository = {
    findBySaleId: jest.fn().mockResolvedValue([
      {
        productId: 'prod-1',
        productName: 'Prod 1',
        quantity: 1,
        unitPrice: 10,
        taxRateId: 'tax-15',
        taxPercentage: 15,
        taxAmount: 1.5,
      },
    ]),
  };
  const mockEventBus = {
    publish: jest.fn(),
  };

  let handler: CreateInvoiceHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInvoiceRepository.create.mockImplementation(async (invoice: Record<string, unknown>) => ({
      ...invoice,
      createdAt: new Date('2026-05-28T00:00:00.000Z'),
    }));

    handler = new CreateInvoiceHandler(
      mockInvoiceRepository as never,
      mockInvoiceItemRepository as never,
      mockInvoiceSeriesRepository as never,
      mockSaleDetailRepository as never,
      mockEventBus as unknown as EventBus,
    );
  });

  it('publishes InvoiceIssuedEvent when command has email payload', async () => {
    await handler.execute(
      new CreateInvoiceCommand(
        'sale-1',
        'branch-1',
        'customer@example.com',
        'Customer',
      ),
    );

    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('does not publish InvoiceIssuedEvent for manual requests without display data', async () => {
    await handler.execute(
      new CreateInvoiceCommand(
        'sale-1',
        'branch-1',
      ),
    );

    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
