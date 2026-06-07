import { QuickConfirmSaleUseCase } from './quick-confirm-sale.use-case';
import { InsufficientStockException } from '../../../domain/exceptions';
import type { IUnitOfWork } from '../../unit-of-work/unit-of-work.interface';

describe('QuickConfirmSaleUseCase', () => {
  it('should throw InsufficientStockException when stock is not enough', async () => {
    const rollback = jest.fn().mockResolvedValue(undefined);
    const commit = jest.fn().mockResolvedValue(undefined);
    const start = jest.fn().mockResolvedValue(undefined);

    const uow: IUnitOfWork = {
      start,
      commit,
      rollback,
      dispatchEvent: jest.fn(),
      sales: {
        findById: jest.fn(),
        findBySaleNumber: jest.fn(),
        getNextSaleNumber: jest.fn().mockResolvedValue('SAL-000001'),
        findAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findByIdWithDetails: jest.fn(),
      },
      saleDetails: {
        findById: jest.fn(),
        findBySaleId: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteBySaleId: jest.fn(),
      },
      products: {
        findById: jest.fn(),
        findByCode: jest.fn(),
        getNextCode: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
        findByIdForUpdate: jest.fn().mockResolvedValue({
          id: 'product-1',
          name: 'Keyboard',
          currentStock: 1,
          salePrice: 10,
          categoryId: 'category-1',
        }),
        incrementStock: jest.fn(),
        decrementStock: jest.fn(),
      },
      stockMovements: {
        findById: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
      },
      invoices: {
        findById: jest.fn(),
        findBySaleId: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      invoiceItems: {
        findById: jest.fn(),
        findByInvoiceId: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
      },
      invoiceSeries: {
        findById: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findActiveByBranchId: jest.fn(),
        activateExclusiveForBranch: jest.fn(),
        incrementSequence: jest.fn(),
      },
    };

    const useCase = new QuickConfirmSaleUseCase(
      uow,
      { findById: jest.fn() } as any,
      { findById: jest.fn() } as any,
      {
        findById: jest.fn().mockResolvedValue({
          id: 'cashier-1',
          employeeId: 'EMP-1',
          username: 'cashier',
          defaultBranchId: 'branch-1',
        }),
      } as any,
      { findById: jest.fn().mockResolvedValue(null) } as any,
    );

    await expect(
      useCase.execute({
        cashierUserId: 'cashier-1',
        customerId: null,
        details: [{ productId: 'product-1', quantity: 3 }],
      } as any),
    ).rejects.toThrow(InsufficientStockException);

    expect(rollback).toHaveBeenCalledTimes(1);
    expect(commit).not.toHaveBeenCalled();
  });
});
