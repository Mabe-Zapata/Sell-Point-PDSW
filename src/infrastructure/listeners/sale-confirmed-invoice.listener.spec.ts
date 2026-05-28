import { SaleConfirmedInvoiceListener } from './sale-confirmed-invoice.listener';
import { CreateInvoiceCommand } from '../../application/cqrs/invoice/commands/create-invoice/create-invoice.command';
import { SaleConfirmedEvent } from '../../domain/events/sale-confirmed.event';

describe('SaleConfirmedInvoiceListener', () => {
  const mockCommandBus = { execute: jest.fn() };
  const mockInvoiceRepository = { findBySaleId: jest.fn() };

  let listener: SaleConfirmedInvoiceListener;

  beforeEach(() => {
    jest.clearAllMocks();
    listener = new SaleConfirmedInvoiceListener(
      mockCommandBus as any,
      mockInvoiceRepository as any,
    );
  });

  it('should create invoice command when sale has branch and no existing invoice', async () => {
    mockInvoiceRepository.findBySaleId.mockResolvedValue(null);
    mockCommandBus.execute.mockResolvedValue(undefined);

    await listener.handle(
      new SaleConfirmedEvent(
        'sale-1',
        new Date(),
        100,
        'customer@test.com',
        'Customer',
        [{ productId: 'p1', productName: 'Prod 1', quantity: 2, unitPrice: 10, subtotal: 20 }],
        undefined,
        'branch-1',
      ),
    );

    expect(mockInvoiceRepository.findBySaleId).toHaveBeenCalledWith('sale-1');
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      new CreateInvoiceCommand('sale-1', 'branch-1', 'customer@test.com', 'Customer'),
    );
  });

  it('should skip when sale already has invoice', async () => {
    mockInvoiceRepository.findBySaleId.mockResolvedValue({ id: 'inv-1' });

    await listener.handle(
      new SaleConfirmedEvent('sale-1', new Date(), 100, 'customer@test.com', 'Customer', [], undefined, 'branch-1'),
    );

    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });
});
