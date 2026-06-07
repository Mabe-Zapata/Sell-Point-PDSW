import { SaleRepositoryImpl } from './sale.repository.impl';

describe('SaleRepositoryImpl', () => {
  it('should load customer data outside the pessimistic lock query', async () => {
    const saleQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 'sale-1',
        branchId: 'branch-1',
        customerId: 'customer-1',
        cashierUserId: 'cashier-1',
        saleNumber: 'SAL-000001',
        paymentMethod: 'CASH',
        status: 'CONFIRMED',
        subtotal: 10,
        taxAmount: 1.5,
        discountAmount: 0,
        total: 11.5,
        createdAt: new Date('2026-06-07T00:00:00.000Z'),
        updatedAt: new Date('2026-06-07T00:00:00.000Z'),
      }),
    };

    const detailQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'detail-1',
          saleId: 'sale-1',
          productId: 'product-1',
          productNameSnapshot: 'Keyboard',
          productCodeSnapshot: 'PROD-1',
          quantity: 2,
          unitPrice: 5,
          taxRateId: 'tax-1',
          taxPercentage: 15,
          taxAmount: 1.5,
          createdAt: new Date('2026-06-07T00:00:00.000Z'),
        },
      ]),
    };

    const manager = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(saleQueryBuilder)
        .mockReturnValueOnce(detailQueryBuilder),
      findOne: jest.fn().mockResolvedValue({
        id: 'customer-1',
        email: 'customer@sellpoint.test',
        firstName: 'Ada',
        lastName: 'Lovelace',
      }),
    };

    const repository = new SaleRepositoryImpl({ manager } as any);

    const sale = await repository.findByIdWithDetails('sale-1');

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(2);
    expect(saleQueryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(manager.findOne).toHaveBeenCalledWith('CustomerTypeOrmEntity', {
      where: { id: 'customer-1' },
    });
    expect(sale?.customerEmail).toBe('customer@sellpoint.test');
    expect(sale?.customerName).toBe('Ada Lovelace');
    expect(sale?.details).toHaveLength(1);
  });
});
