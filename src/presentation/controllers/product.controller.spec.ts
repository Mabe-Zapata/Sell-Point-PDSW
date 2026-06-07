import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ProductController } from './product.controller';
import { ListProductsWithStockQuery } from '../../application/cqrs/product/queries/list-products-with-stock/list-products-with-stock.query';
import { GetProductQuery } from '../../application/cqrs/product/queries/get-product/get-product.query';
import { CreateProductCommand } from '../../application/cqrs/product/commands/create-product/create-product.command';
import { AdjustStockCommand } from '../../application/cqrs/inventory/commands/adjust-stock/adjust-stock.command';
import { GetMovementsHistoryQuery } from '../../application/cqrs/inventory/queries/get-movements-history/get-movements-history.query';
import { AdjustStockDto } from '../../application/dto/stock/adjust-stock.dto';
import { StockMovementType } from '../../domain/entities/enums/stock-movement-type.enum';
import { StockMovement } from '../../domain/entities/stock-movement.entity';
import { StockMovementResponseDto } from '../../application/dto/stock/stock-movement-response.dto';
import { DASHBOARD_REPOSITORY, PRODUCT_REPOSITORY } from '../../infrastructure/common/injection-tokens';

describe('ProductController', () => {
  let controller: ProductController;
  let mockQueryBus: jest.Mocked<QueryBus>;
  let mockCommandBus: jest.Mocked<CommandBus>;

  beforeEach(async () => {
    mockQueryBus = {
      execute: jest.fn(),
    } as any;

    mockCommandBus = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        { provide: QueryBus, useValue: mockQueryBus },
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: PRODUCT_REPOSITORY, useValue: { findAll: jest.fn() } },
        { provide: DASHBOARD_REPOSITORY, useValue: {} },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
  });

  describe('findAll', () => {
    it('should call queryBus.execute with ListProductsWithStockQuery', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };
      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.findAll({ page: 1, limit: 20 }, 'test', undefined, 'true');

      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(ListProductsWithStockQuery),
      );
      const calledQuery = mockQueryBus.execute.mock.calls[0][0] as ListProductsWithStockQuery;
      expect(calledQuery.pagination).toEqual({ page: 1, limit: 20 });
      expect(calledQuery.q).toBe('test');
      expect(calledQuery.categoryId).toBeUndefined();
      expect(calledQuery.isActive).toBe(true);
      expect(result).toEqual(mockResult);
    });

    it('should use default pagination when params not provided', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };
      mockQueryBus.execute.mockResolvedValue(mockResult);

      await controller.findAll({}, undefined, undefined, undefined);

      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(ListProductsWithStockQuery),
      );
    });
  });

  describe('findOne', () => {
    it('should call queryBus.execute with GetProductQuery', async () => {
      const mockProduct = {
        id: 'prod-123',
        code: 'PROD-ABCDEF1234567890',
        name: 'Test Product',
      };
      mockQueryBus.execute.mockResolvedValue(mockProduct);

      const result = await controller.findOne('prod-123');

      expect(mockQueryBus.execute).toHaveBeenCalledWith(new GetProductQuery('prod-123'));
      expect(result).toEqual(mockProduct);
    });
  });

  describe('create', () => {
    it('should call commandBus.execute with CreateProductCommand', async () => {
      const mockProduct = {
        id: 'prod-123',
        code: 'PROD-ABCDEF1234567890',
        name: 'Test Product',
      };
      mockCommandBus.execute.mockResolvedValue(mockProduct);

      const createDto = {
        categoryId: 'cat-123',
        name: 'Test Product',
        salePrice: 100,
        costPrice: 50,
      };

      const result = await controller.create(createDto);

      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new CreateProductCommand(createDto),
      );
      expect(result).toEqual(mockProduct);
    });
  });

  describe('adjustStock', () => {
    it('should call commandBus.execute with AdjustStockCommand and return StockMovementResponseDto', async () => {
      const mockMovement = new StockMovement({
        id: 1,
        productId: 'prod-123',
        type: StockMovementType.IN,
        quantity: 5,
        previousStock: 10,
        newStock: 15,
        createdAt: new Date('2026-05-24'),
      });
      mockCommandBus.execute.mockResolvedValue(mockMovement);

      const dto: AdjustStockDto = {
        type: StockMovementType.IN,
        quantity: 5,
      };

      const result = await controller.adjustStock('prod-123', dto);

      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new AdjustStockCommand('prod-123', dto),
      );
      expect(result).toBeInstanceOf(StockMovementResponseDto);
      expect(result.productId).toBe('prod-123');
      expect(result.quantity).toBe(5);
      expect(result.previousStock).toBe(10);
      expect(result.newStock).toBe(15);
    });
  });

  describe('findMovements', () => {
    it('should call queryBus.execute with GetMovementsHistoryQuery', async () => {
      const mockMovement = new StockMovement({
        id: 1,
        productId: 'prod-123',
        type: StockMovementType.IN,
        quantity: 5,
        previousStock: 10,
        newStock: 15,
        createdAt: new Date('2026-05-24'),
      });

      const mockResult = {
        data: [mockMovement],
        total: 1,
        page: 1,
        limit: 20,
      };
      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.findMovements('prod-123', { page: 1, limit: 20 }, 'IN');

      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(GetMovementsHistoryQuery),
      );
      const calledQuery = mockQueryBus.execute.mock.calls[0][0] as GetMovementsHistoryQuery;
      expect(calledQuery.productId).toBe('prod-123');
      expect(calledQuery.type).toBe('IN');
      expect(result.data[0]).toBeInstanceOf(StockMovementResponseDto);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should use default pagination when params not provided', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };
      mockQueryBus.execute.mockResolvedValue(mockResult);

      await controller.findMovements('prod-123', {}, undefined);

      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(GetMovementsHistoryQuery),
      );
    });
  });
});
