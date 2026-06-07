import { ConfirmSaleUseCase } from './confirm-sale.use-case';
import { SaleStatus } from '../../../domain/entities/enums';
import { InsufficientStockException } from '../../../domain/exceptions';
import type { IUnitOfWork } from '../../unit-of-work/unit-of-work.interface';

describe('ConfirmSaleUseCase', () => {
  it('should throw InsufficientStockException when stock is not enough', async () => {
    const rollback = jest.fn().mockResolvedValue(undefined);
    const commit = jest.fn().mockResolvedValue(undefined);
    const start = jest.fn().mockResolvedValue(undefined);

    const sale = {
      id: 'sale-1',
      branchId: 'branch-1',
      total: 10,
      customerEmail: 'customer@sellpoint.test',
      customerName: 'Ada Lovelace',
      details: [{ productId: 'product-1', productName: 'Keyboard', quantity: 3, unitPrice: 10 }],
      status: SaleStatus.DRAFT,
      paymentMethod: 'CASH',
      confirm: jest.fn(),
    };

    const uow: IUnitOfWork = {
      start,
      commit,
      rollback,
      dispatchEvent: jest.fn(),
      sales: {
        findById: jest.fn(),
        findBySaleNumber: jest.fn(),
        getNextSaleNumber: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findByIdWithDetails: jest.fn().mockResolvedValue(sale as any),
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

    const useCase = new ConfirmSaleUseCase(uow);

    await expect(useCase.execute('sale-1')).rejects.toThrow(InsufficientStockException);
    expect(rollback).toHaveBeenCalledTimes(1);
    expect(commit).not.toHaveBeenCalled();
  });
});
