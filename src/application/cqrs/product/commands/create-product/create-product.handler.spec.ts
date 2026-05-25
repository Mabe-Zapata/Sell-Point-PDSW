import { CreateProductHandler } from './create-product.handler';
import type { ICategoryRepository } from '../../../../../domain/repositories';
import type { IProductRepository } from '../../../../../domain/repositories';
import type { IStockMovementRepository } from '../../../../../domain/repositories';
import { Product } from '../../../../../domain/entities/product.entity';
import { StockMovement } from '../../../../../domain/entities/stock-movement.entity';
import { CreateProductCommand } from './create-product.command';
import { CreateProductDto } from '../../../../dto/product/create-product.dto';

describe('CreateProductHandler', () => {
  let handler: CreateProductHandler;
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>;
  let mockRepository: jest.Mocked<IProductRepository>;
  let mockStockMovementRepository: jest.Mocked<IStockMovementRepository>;

  beforeEach(() => {
    mockCategoryRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    mockRepository = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    mockStockMovementRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
    } as any;

    mockCategoryRepository.findById.mockResolvedValue({} as any);

    handler = new CreateProductHandler(mockCategoryRepository, mockRepository, mockStockMovementRepository);
  });

  it('should create product and call repository.create', async () => {
    const mockProduct = {
      id: 'prod-123',
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      description: 'Test description',
      salePrice: 100,
      costPrice: 50,
      isActive: true,
    } as Product;

    mockRepository.create.mockResolvedValue(mockProduct);

    const dto: CreateProductDto = {
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      description: 'Test description',
      salePrice: 100,
      costPrice: 50,
    };

    const command = new CreateProductCommand(dto);
    const result = await handler.execute(command);

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'cat-123',
        code: 'PROD-001',
        name: 'Test Product',
      }),
    );
    expect(result).toEqual(mockProduct);
  });

  it('should set isActive to true by default when not provided', async () => {
    const mockProduct = {
      id: 'prod-123',
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      salePrice: 100,
      costPrice: 50,
      isActive: true,
    } as Product;

    mockRepository.create.mockResolvedValue(mockProduct);

    const dto: CreateProductDto = {
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      salePrice: 100,
      costPrice: 50,
    };

    const command = new CreateProductCommand(dto);
    const result = await handler.execute(command);

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true }),
    );
    expect(result.isActive).toBe(true);
  });

  it('should set currentStock to initialStock when provided', async () => {
    const mockProduct = {
      id: 'prod-123',
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      salePrice: 100,
      costPrice: 50,
      currentStock: 50,
      isActive: true,
    } as Product;

    mockRepository.create.mockResolvedValue(mockProduct);
    mockStockMovementRepository.create.mockResolvedValue({} as StockMovement);

    const dto: CreateProductDto = {
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      salePrice: 100,
      costPrice: 50,
      initialStock: 50,
    };

    const command = new CreateProductCommand(dto);
    await handler.execute(command);

    expect(mockStockMovementRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 50,
        previousStock: 0,
        newStock: 50,
      }),
    );
  });

  it('should not create movement when initialStock is 0', async () => {
    const mockProduct = {
      id: 'prod-123',
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      salePrice: 100,
      costPrice: 50,
      currentStock: 0,
      isActive: true,
    } as Product;

    mockRepository.create.mockResolvedValue(mockProduct);

    const dto: CreateProductDto = {
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      salePrice: 100,
      costPrice: 50,
      initialStock: 0,
    };

    const command = new CreateProductCommand(dto);
    await handler.execute(command);

    expect(mockStockMovementRepository.create).not.toHaveBeenCalled();
  });

  it('should not create movement when initialStock is not provided', async () => {
    const mockProduct = {
      id: 'prod-123',
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      salePrice: 100,
      costPrice: 50,
      currentStock: 0,
      isActive: true,
    } as Product;

    mockRepository.create.mockResolvedValue(mockProduct);

    const dto: CreateProductDto = {
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      salePrice: 100,
      costPrice: 50,
    };

    const command = new CreateProductCommand(dto);
    await handler.execute(command);

    expect(mockStockMovementRepository.create).not.toHaveBeenCalled();
  });
});
