import { CancelSaleUseCase } from '../../../../use-cases/sale/cancel-sale.use-case';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';
import { Sale } from '../../../../../domain/entities/sale.entity';
import { Product } from '../../../../../domain/entities/product.entity';
import type { IUnitOfWork } from '../../../../unit-of-work/unit-of-work.interface';

describe('CancelSaleUseCase', () => {
  let useCase: CancelSaleUseCase;

  let startMock: jest.MockedFunction<IUnitOfWork['start']>;
  let commitMock: jest.MockedFunction<IUnitOfWork['commit']>;
  let rollbackMock: jest.MockedFunction<IUnitOfWork['rollback']>;
  let dispatchEventMock: jest.MockedFunction<IUnitOfWork['dispatchEvent']>;
  let findSaleByIdWithDetailsMock: jest.MockedFunction<IUnitOfWork['sales']['findByIdWithDetails']>;
  let updateSaleMock: jest.MockedFunction<IUnitOfWork['sales']['update']>;
  let findProductByIdForUpdateMock: jest.MockedFunction<IUnitOfWork['products']['findByIdForUpdate']>;
  let incrementStockMock: jest.MockedFunction<IUnitOfWork['products']['incrementStock']>;
  let createStockMovementMock: jest.MockedFunction<IUnitOfWork['stockMovements']['create']>;

  beforeEach(() => {
    startMock = jest.fn().mockResolvedValue(undefined);
    commitMock = jest.fn().mockResolvedValue(undefined);
    rollbackMock = jest.fn().mockResolvedValue(undefined);
    dispatchEventMock = jest.fn();
    findSaleByIdWithDetailsMock = jest.fn();
    updateSaleMock = jest.fn();
    findProductByIdForUpdateMock = jest.fn();
    incrementStockMock = jest.fn().mockResolvedValue(undefined);
    createStockMovementMock = jest.fn();

    const mockUow: IUnitOfWork = {
      start: startMock,
      commit: commitMock,
      rollback: rollbackMock,
      dispatchEvent: dispatchEventMock,
      sales: {
        findById: jest.fn(),
        findBySaleNumber: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        findByIdWithDetails: findSaleByIdWithDetailsMock,
        update: updateSaleMock,
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
        findAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
        findByIdForUpdate: findProductByIdForUpdateMock,
        incrementStock: incrementStockMock,
        decrementStock: jest.fn(),
      },
      stockMovements: {
        findById: jest.fn(),
        findAll: jest.fn(),
        create: createStockMovementMock,
      },
    };

    useCase = new CancelSaleUseCase(mockUow);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should throw BusinessRuleException when sale does not exist', async () => {
      findSaleByIdWithDetailsMock.mockResolvedValue(null);

      await expect(useCase.execute('sale-inexistente')).rejects.toThrow(BusinessRuleException);
      expect(rollbackMock).toHaveBeenCalledTimes(1);
      expect(commitMock).not.toHaveBeenCalled();
    });

    it('should cancel a sale and restore stock for each detail', async () => {
      const cancelMock = jest.fn();
      const mockSale = {
        id: 'sale-123',
        saleNumber: 'V-001',
        status: 'CONFIRMED',
        details: [{ productId: 'prod-1', quantity: 5 }],
        cancel: cancelMock,
      } as unknown as Sale;
      const mockProduct = { id: 'prod-1', currentStock: 10 } as Product;

      findSaleByIdWithDetailsMock.mockResolvedValue(mockSale);
      findProductByIdForUpdateMock.mockResolvedValue(mockProduct);

      await useCase.execute('sale-123');

      expect(startMock).toHaveBeenCalledTimes(1);
      expect(findSaleByIdWithDetailsMock).toHaveBeenCalledWith('sale-123');
      expect(findProductByIdForUpdateMock).toHaveBeenCalledWith('prod-1');
      expect(incrementStockMock).toHaveBeenCalledWith('prod-1', 5);
      expect(createStockMovementMock).toHaveBeenCalledTimes(1);
      expect(updateSaleMock).toHaveBeenCalledWith(mockSale);
      expect(commitMock).toHaveBeenCalledTimes(1);
      expect(rollbackMock).not.toHaveBeenCalled();
      expect(cancelMock).toHaveBeenCalledTimes(1);
    });

    it('should rollback when an error occurs during execution', async () => {
      const cancelMock = jest.fn();
      const mockSale = {
        id: 'sale-123',
        saleNumber: 'V-001',
        status: 'CONFIRMED',
        details: [{ productId: 'prod-1', quantity: 5 }],
        cancel: cancelMock,
      } as unknown as Sale;

      findSaleByIdWithDetailsMock.mockResolvedValue(mockSale);
      findProductByIdForUpdateMock.mockRejectedValue(new Error('DB Error'));

      await expect(useCase.execute('sale-123')).rejects.toThrow('DB Error');
      expect(rollbackMock).toHaveBeenCalledTimes(1);
      expect(commitMock).not.toHaveBeenCalled();
      expect(cancelMock).not.toHaveBeenCalled();
    });
  });
});
