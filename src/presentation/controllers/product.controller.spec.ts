import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ProductController } from './product.controller';
import { ListProductsWithStockQuery } from '../../application/cqrs/product/queries/list-products-with-stock/list-products-with-stock.query';
import { GetProductQuery } from '../../application/cqrs/product/queries/get-product/get-product.query';
import { CreateProductCommand } from '../../application/cqrs/product/commands/create-product/create-product.command';

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

      const result = await controller.findAll('1', '20', 'test', undefined, 'true');

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

      await controller.findAll(undefined, undefined, undefined, undefined, undefined);

      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(ListProductsWithStockQuery),
      );
    });
  });

  describe('findOne', () => {
    it('should call queryBus.execute with GetProductQuery', async () => {
      const mockProduct = {
        id: 'prod-123',
        code: 'PROD-001',
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
        code: 'PROD-001',
        name: 'Test Product',
      };
      mockCommandBus.execute.mockResolvedValue(mockProduct);

      const createDto = {
        categoryId: 'cat-123',
        code: 'PROD-001',
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
});