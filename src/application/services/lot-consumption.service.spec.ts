import { InvoiceItem, Lot } from '../../domain/entities';
import { BusinessRuleException, InsufficientStockException } from '../../domain/exceptions';
import { LotConsumptionService } from './lot-consumption.service';

describe('LotConsumptionService', () => {
  const product = {
    id: 'prod-1',
    name: 'Product 1',
    salePrice: 10,
    currentStock: 10,
  };

  const makeLot = (id: string, lotCode: string, quantityAvailable: number, unitCost: number, receivedAt: string) =>
    new Lot({
      id,
      productId: 'prod-1',
      lotCode,
      quantityReceived: quantityAvailable,
      quantityAvailable,
      unitCost,
      estimatedUnitProfit: 10 - unitCost,
      receivedAt: new Date(receivedAt),
      createdAt: new Date(receivedAt),
      updatedAt: new Date(receivedAt),
    });

  const setup = (lots: Lot[], currentStock = 10) => {
    const lotRepository = {
      findActiveByProductIdForUpdate: jest.fn().mockResolvedValue(lots),
      setQuantityAvailable: jest.fn(),
    };
    const productRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue({ ...product, currentStock }),
      decrementStock: jest.fn(),
    };
    const invoiceItemLotRepository = {
      createMany: jest.fn().mockImplementation(async (records) => records),
    };
    const stockMovementRepository = {
      create: jest.fn(),
    };

    const service = new LotConsumptionService(
      lotRepository as any,
      productRepository as any,
      invoiceItemLotRepository as any,
      stockMovementRepository as any,
    );

    return { service, lotRepository, productRepository, invoiceItemLotRepository, stockMovementRepository };
  };

  const invoiceItem = new InvoiceItem({
    id: 'item-1',
    invoiceId: 'inv-1',
    productId: 'prod-1',
    productName: 'Product 1',
    quantity: 7,
    unitPrice: 10,
  });

  it('consumes one lot and persists profit', async () => {
    const { service, lotRepository, invoiceItemLotRepository } = setup([
      makeLot('lot-1', 'LOT-001', 10, 4, '2026-05-01T00:00:00.000Z'),
    ]);

    const result = await service.consumeInvoiceItems([invoiceItem], 'sale-1');

    expect(lotRepository.setQuantityAvailable).toHaveBeenCalledWith('lot-1', 3);
    expect(invoiceItemLotRepository.createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        lotId: 'lot-1',
        quantityUsed: 7,
        unitCostSnapshot: 4,
        profitAmount: 42,
      }),
    ]);
    expect(result.profitTotal).toBe(42);
    expect(result.lotCodesByInvoiceItemId.get('item-1')).toEqual(['LOT-001']);
  });

  it('consumes multiple lots in FIFO order', async () => {
    const { service, lotRepository } = setup([
      makeLot('lot-old', 'OLD', 3, 4, '2026-05-01T00:00:00.000Z'),
      makeLot('lot-new', 'NEW', 10, 6, '2026-05-02T00:00:00.000Z'),
    ]);

    const result = await service.consumeInvoiceItems([invoiceItem], 'sale-1');

    expect(lotRepository.setQuantityAvailable).toHaveBeenNthCalledWith(1, 'lot-old', 0);
    expect(lotRepository.setQuantityAvailable).toHaveBeenNthCalledWith(2, 'lot-new', 6);
    expect(result.profitTotal).toBe(34);
    expect(result.lotCodesByInvoiceItemId.get('item-1')).toEqual(['OLD', 'NEW']);
  });

  it('throws when product stock is insufficient', async () => {
    const { service } = setup([], 1);

    await expect(service.consumeInvoiceItems([invoiceItem], 'sale-1')).rejects.toThrow(InsufficientStockException);
  });

  it('throws when lot stock is insufficient even if product stock says available', async () => {
    const { service } = setup([
      makeLot('lot-1', 'LOT-001', 2, 4, '2026-05-01T00:00:00.000Z'),
    ]);

    await expect(service.consumeInvoiceItems([invoiceItem], 'sale-1')).rejects.toThrow(BusinessRuleException);
  });
});
