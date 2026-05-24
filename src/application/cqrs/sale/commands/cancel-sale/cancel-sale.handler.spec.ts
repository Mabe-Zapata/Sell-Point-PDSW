/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryRunner } from 'typeorm';
import { CancelSaleHandler } from './cancel-sale.handler';
import { CancelSaleValidator } from './cancel-sale.validator';
import { SALE_REPOSITORY } from '../../../../tokens';
import { SaleTypeOrmEntity } from '../../../../../infrastructure/database/entities/sale.typeorm.entity';
import { SaleDetailTypeOrmEntity } from '../../../../../infrastructure/database/entities/sale-detail.typeorm.entity';
import { ProductTypeOrmEntity } from '../../../../../infrastructure/database/entities/product.typeorm.entity';
import { CancelSaleCommand } from './cancel-sale.command';

describe('CancelSaleHandler', () => {
  let handler: CancelSaleHandler;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;
  let sharedQueryBuilder: any;

  const mockSale: SaleTypeOrmEntity = {
    id: 'sale-123',
    branchId: 'branch-1',
    customerId: 'customer-1',
    cashierUserId: 'user-1',
    taxRateId: 'tax-1',
    saleNumber: 'SAL-001',
    status: 'CONFIRMED',
    subtotal: 100,
    taxAmount: 12,
    discountAmount: 0,
    total: 112,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {} as any,
    cashierUser: {} as any,
    taxRate: {} as any,
  };

  const mockSaleDetails: SaleDetailTypeOrmEntity[] = [
    {
      id: 1,
      saleId: 'sale-123',
      productId: 'product-1',
      productNameSnapshot: 'Product A',
      productCodeSnapshot: 'PRO-A',
      quantity: 5,
      unitPrice: 20,
      createdAt: new Date(),
      sale: mockSale,
      product: {} as any,
    },
  ];

  const mockProduct: ProductTypeOrmEntity = {
    id: 'product-1',
    categoryId: 'cat-1',
    code: 'PRO-A',
    name: 'Product A',
    description: undefined,
    salePrice: 20,
    costPrice: 10,
    isActive: true,
    currentStock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {} as any,
    unitPrice: 20,
    availableQuantity: 10,
  };

  beforeEach(async () => {
    sharedQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    };

    const managerMock = {
      createQueryBuilder: jest.fn().mockReturnValue(sharedQueryBuilder),
      create: jest.fn().mockImplementation((_entity, data) => data),
      save: jest.fn().mockImplementation((entity) => entity),
    };

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: managerMock,
    } as any;

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelSaleHandler,
        CancelSaleValidator,
        {
          provide: SALE_REPOSITORY,
          useValue: { findById: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    handler = module.get<CancelSaleHandler>(CancelSaleHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should commit transaction on successful cancellation', async () => {
      sharedQueryBuilder.getOne.mockResolvedValueOnce(mockSale);
      sharedQueryBuilder.getMany.mockResolvedValue([...mockSaleDetails]);
      sharedQueryBuilder.getOne.mockResolvedValueOnce(mockProduct);

      await handler.execute(new CancelSaleCommand('sale-123'));

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      sharedQueryBuilder.getOne.mockRejectedValueOnce(new Error('DB error'));

      await expect(handler.execute(new CancelSaleCommand('sale-123')))
        .rejects.toThrow('DB error');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw error when sale not found', async () => {
      sharedQueryBuilder.getOne.mockResolvedValueOnce(null);

      await expect(handler.execute(new CancelSaleCommand('nonexistent')))
        .rejects.toThrow("Sale with ID 'nonexistent' not found");

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should use pessimistic_write lock', async () => {
      sharedQueryBuilder.getOne.mockResolvedValueOnce(mockSale);
      sharedQueryBuilder.getMany.mockResolvedValue([...mockSaleDetails]);
      sharedQueryBuilder.getOne.mockResolvedValueOnce(mockProduct);

      await handler.execute(new CancelSaleCommand('sale-123'));

      expect(sharedQueryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
    });

    it('should always release queryRunner even if error occurs', async () => {
      sharedQueryBuilder.getOne.mockRejectedValueOnce(new Error('DB error'));

      await expect(handler.execute(new CancelSaleCommand('sale-123')))
        .rejects.toThrow('DB error');

      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });
  });
});