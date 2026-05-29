import { BadRequestException, ConflictException } from '@nestjs/common';
import { QuickConfirmSaleCommand } from '../../../../../application/cqrs/sale/commands/quick-confirm-sale/quick-confirm-sale.command';
import { IdempotencyService } from '../../../../services/idempotency.service';
import { QuickConfirmSaleHandler } from './QuickConfirmSaleHandler';

describe('QuickConfirmSaleHandler idempotency', () => {
  const saleResponse = {
    id: 'sale-1',
    saleNumber: 'SAL-1',
    subtotal: 10,
    taxAmount: 1.5,
    total: 11.5,
    status: 'CONFIRMED',
    invoice: {
      id: 'invoice-1',
      saleId: 'sale-1',
      seriesId: 'series-1',
      invoiceNumber: '001-001-000000001',
      issueDate: new Date('2026-05-28T00:00:00.000Z'),
      status: 'ISSUED',
      subtotal: 10,
      iva: 1.5,
      total: 11.5,
      pdfUrl: '/invoices/invoice-1/pdf',
      items: [],
    },
  };

  const payload = {
    customerId: null,
    cashierUserId: 'user-1',
    idempotencyKey: 'idem-1',
    details: [
      { productId: 'prod-b', quantity: 1 },
      { productId: 'prod-a', quantity: 2 },
    ],
  };

  let idempotencyService: jest.Mocked<Pick<IdempotencyService, 'begin' | 'complete' | 'fail'>>;
  let handler: QuickConfirmSaleHandler;
  let useCase: { execute: jest.Mock };

  beforeEach(() => {
    idempotencyService = {
      begin: jest.fn().mockResolvedValue({ status: 'STARTED' }),
      complete: jest.fn(),
      fail: jest.fn(),
    };

    handler = new QuickConfirmSaleHandler(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      idempotencyService as IdempotencyService,
    );

    useCase = { execute: jest.fn().mockResolvedValue(saleResponse) };
    (handler as unknown as { useCase: typeof useCase }).useCase = useCase;
  });

  it('requires x-idempotency-key', async () => {
    await expect(
      handler.execute(new QuickConfirmSaleCommand({ ...payload, idempotencyKey: undefined })),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('returns stored response for completed duplicate requests', async () => {
    idempotencyService.begin.mockResolvedValueOnce({
      status: 'COMPLETED',
      response: saleResponse,
    });

    const result = await handler.execute(new QuickConfirmSaleCommand(payload));

    expect(result).toEqual(saleResponse);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejects payload mismatch for reused idempotency keys', async () => {
    idempotencyService.begin.mockResolvedValueOnce({ status: 'PAYLOAD_MISMATCH' });

    await expect(
      handler.execute(new QuickConfirmSaleCommand(payload)),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejects concurrent in-progress duplicate requests', async () => {
    idempotencyService.begin.mockResolvedValueOnce({ status: 'IN_PROGRESS' });

    await expect(
      handler.execute(new QuickConfirmSaleCommand(payload)),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('executes and stores response for new idempotency keys', async () => {
    const result = await handler.execute(new QuickConfirmSaleCommand(payload));

    expect(result).toEqual(saleResponse);
    expect(useCase.execute).toHaveBeenCalledWith(payload);
    expect(idempotencyService.complete).toHaveBeenCalledWith('idem-1', saleResponse);
    expect(idempotencyService.fail).not.toHaveBeenCalled();
  });

  it('marks key as failed when use case fails', async () => {
    useCase.execute.mockRejectedValueOnce(new Error('sale failed'));

    await expect(
      handler.execute(new QuickConfirmSaleCommand(payload)),
    ).rejects.toThrow('sale failed');

    expect(idempotencyService.fail).toHaveBeenCalledWith('idem-1');
  });

  it('uses deterministic payload hashing independent from detail order', async () => {
    await handler.execute(new QuickConfirmSaleCommand(payload));
    const firstHash = idempotencyService.begin.mock.calls[0][1];

    await handler.execute(new QuickConfirmSaleCommand({
      ...payload,
      details: [...payload.details].reverse(),
    }));
    const secondHash = idempotencyService.begin.mock.calls[1][1];

    expect(firstHash).toEqual(secondHash);
  });
});
