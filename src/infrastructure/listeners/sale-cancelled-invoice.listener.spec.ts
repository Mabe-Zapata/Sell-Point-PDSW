import { InvoiceStatus } from '../../domain/entities';
import { SaleCancelledEvent } from '../../domain/events/sale-cancelled.event';
import { SaleCancelledInvoiceListener } from './sale-cancelled-invoice.listener';

describe('SaleCancelledInvoiceListener', () => {
  const mockCommandBus = { execute: jest.fn() };
  const mockInvoiceRepository = { findBySaleId: jest.fn() };

  let listener: SaleCancelledInvoiceListener;

  beforeEach(() => {
    jest.clearAllMocks();
    listener = new SaleCancelledInvoiceListener(mockCommandBus as any, mockInvoiceRepository as any);
  });

  it('should cancel linked invoice when invoice exists and is issued', async () => {
    mockInvoiceRepository.findBySaleId.mockResolvedValue({ id: 'inv-1', status: InvoiceStatus.ISSUED });
    mockCommandBus.execute.mockResolvedValue(undefined);

    await listener.handle(new SaleCancelledEvent('sale-1', new Date()));

    expect(mockCommandBus.execute).toHaveBeenCalled();
  });

  it('should skip when no invoice exists', async () => {
    mockInvoiceRepository.findBySaleId.mockResolvedValue(null);

    await listener.handle(new SaleCancelledEvent('sale-1', new Date()));

    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });
});
