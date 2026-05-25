import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AdjustStockHandler } from './adjust-stock.handler';
import { AdjustStockValidator } from './adjust-stock.validator';
import { AdjustStockCommand } from './adjust-stock.command';
import { AdjustStockDto } from '../../../../dto/stock/adjust-stock.dto';
import { PRODUCT_REPOSITORY, STOCK_MOVEMENT_REPOSITORY } from '../../../../tokens';
import type { IProductRepository } from '../../../../../domain/repositories/product.repository.interface';
import type { IStockMovementRepository } from '../../../../../domain/repositories/stock-movement.repository.interface';
import { StockMovementType } from '../../../../../domain/entities/enums/stock-movement-type.enum';
import { Product } from '../../../../../domain/entities/product.entity';
import { StockMovement } from '../../../../../domain/entities/stock-movement.entity';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { InsufficientStockException } from '../../../../../domain/exceptions/insufficient-stock.exception';

describe('AdjustStockHandler', () => {
  let handler: AdjustStockHandler;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockStockMovementRepository: jest.Mocked<IStockMovementRepository>;
  let mockValidator: AdjustStockValidator;

  const mockProduct = new Product({
    id: 'prod-123',
    categoryId: 'cat-123',
    code: 'PROD-001',
    name: 'Test Product',
    salePrice: 100,
    costPrice: 50,
    currentStock: 10,
    isActive: true,
  });

  const mockMovement = new StockMovement({
    id: 1,
    productId: 'prod-123',
    type: StockMovementType.IN,
    quantity: 5,
    previousStock: 10,
    newStock: 15,
    createdAt: new Date(),
  });

  beforeEach(async () => {
    mockProductRepository = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      incrementStock: jest.fn(),
      decrementStock: jest.fn(),
    } as any;

    mockStockMovementRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
    } as any;

    mockValidator = {
      validate: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdjustStockHandler,
        { provide: AdjustStockValidator, useValue: mockValidator },
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
        { provide: STOCK_MOVEMENT_REPOSITORY, useValue: mockStockMovementRepository },
      ],
    }).compile();

    handler = module.get<AdjustStockHandler>(AdjustStockHandler);
  });

  it('should create IN movement with correct values', async () => {
    mockProductRepository.findById.mockResolvedValue(mockProduct);
    mockStockMovementRepository.create.mockResolvedValue(mockMovement);

    const dto: AdjustStockDto = {
      type: StockMovementType.IN,
      quantity: 5,
    };

    const command = new AdjustStockCommand('prod-123', dto);
    const result = await handler.execute(command);

    expect(mockValidator.validate).toHaveBeenCalledWith(dto);
    expect(mockProductRepository.findById).toHaveBeenCalledWith('prod-123');
    expect(mockProductRepository.incrementStock).toHaveBeenCalledWith('prod-123', 5);
    expect(mockStockMovementRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod-123',
        type: StockMovementType.IN,
        quantity: 5,
        previousStock: 10,
        newStock: 15,
      }),
    );
    expect(result).toEqual(mockMovement);
  });

  it('should create OUT movement with sufficient stock', async () => {
    const productWithStock = new Product({
      id: 'prod-123',
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      salePrice: 100,
      costPrice: 50,
      currentStock: 10,
      isActive: true,
    });

    const outMovement = new StockMovement({
      id: 2,
      productId: 'prod-123',
      type: StockMovementType.OUT,
      quantity: 3,
      previousStock: 10,
      newStock: 7,
      createdAt: new Date(),
    });

    mockProductRepository.findById.mockResolvedValue(productWithStock);
    mockStockMovementRepository.create.mockResolvedValue(outMovement);

    const dto: AdjustStockDto = {
      type: StockMovementType.OUT,
      quantity: 3,
    };

    const command = new AdjustStockCommand('prod-123', dto);
    const result = await handler.execute(command);

    expect(mockValidator.validate).toHaveBeenCalledWith(dto);
    expect(mockProductRepository.decrementStock).toHaveBeenCalledWith('prod-123', 3);
    expect(mockStockMovementRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod-123',
        type: StockMovementType.OUT,
        quantity: 3,
        previousStock: 10,
        newStock: 7,
      }),
    );
    expect(result).toEqual(outMovement);
  });

  it('should throw InsufficientStockException when OUT with insufficient stock', async () => {
    const lowStockProduct = new Product({
      id: 'prod-123',
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      salePrice: 100,
      costPrice: 50,
      currentStock: 2,
      isActive: true,
    });

    mockProductRepository.findById.mockResolvedValue(lowStockProduct);
    mockProductRepository.decrementStock.mockRejectedValue(
      new InsufficientStockException('Test Product', 5, 2),
    );

    const dto: AdjustStockDto = {
      type: StockMovementType.OUT,
      quantity: 5,
    };

    const command = new AdjustStockCommand('prod-123', dto);

    await expect(handler.execute(command)).rejects.toThrow(InsufficientStockException);
    expect(mockProductRepository.decrementStock).toHaveBeenCalledWith('prod-123', 5);
    expect(mockStockMovementRepository.create).not.toHaveBeenCalled();
  });

  it('should throw EntityNotFoundException when product does not exist', async () => {
    mockProductRepository.findById.mockResolvedValue(null);

    const dto: AdjustStockDto = {
      type: StockMovementType.IN,
      quantity: 5,
    };

    const command = new AdjustStockCommand('nonexistent', dto);

    await expect(handler.execute(command)).rejects.toThrow(EntityNotFoundException);
    expect(mockProductRepository.incrementStock).not.toHaveBeenCalled();
    expect(mockStockMovementRepository.create).not.toHaveBeenCalled();
  });

  it('should handle ADJUSTMENT with positive delta', async () => {
    const product = new Product({
      id: 'prod-123',
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      salePrice: 100,
      costPrice: 50,
      currentStock: 10,
      isActive: true,
    });

    const adjMovement = new StockMovement({
      id: 3,
      productId: 'prod-123',
      type: StockMovementType.ADJUSTMENT,
      quantity: 15,
      previousStock: 10,
      newStock: 25,
      createdAt: new Date(),
    });

    mockProductRepository.findById.mockResolvedValue(product);
    mockStockMovementRepository.create.mockResolvedValue(adjMovement);

    const dto: AdjustStockDto = {
      type: StockMovementType.ADJUSTMENT,
      quantity: 15,
    };

    const command = new AdjustStockCommand('prod-123', dto);
    const result = await handler.execute(command);

    expect(mockProductRepository.incrementStock).toHaveBeenCalledWith('prod-123', 15);
    expect(mockStockMovementRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: StockMovementType.ADJUSTMENT,
        quantity: 15,
        previousStock: 10,
        newStock: 25,
      }),
    );
    expect(result).toEqual(adjMovement);
  });

  it('should handle ADJUSTMENT with negative delta (decrease stock)', async () => {
    const product = new Product({
      id: 'prod-123',
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      salePrice: 100,
      costPrice: 50,
      currentStock: 10,
      isActive: true,
    });

    const adjMovement = new StockMovement({
      id: 4,
      productId: 'prod-123',
      type: StockMovementType.ADJUSTMENT,
      quantity: 5,
      previousStock: 10,
      newStock: 5,
      createdAt: new Date(),
    });

    mockProductRepository.findById.mockResolvedValue(product);
    mockStockMovementRepository.create.mockResolvedValue(adjMovement);

    const dto: AdjustStockDto = {
      type: StockMovementType.ADJUSTMENT,
      quantity: -5,
    };

    const command = new AdjustStockCommand('prod-123', dto);
    const result = await handler.execute(command);

    expect(mockProductRepository.decrementStock).toHaveBeenCalledWith('prod-123', 5);
    expect(mockStockMovementRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: StockMovementType.ADJUSTMENT,
        quantity: 5,
        previousStock: 10,
        newStock: 5,
      }),
    );
    expect(result).toEqual(adjMovement);
  });

  it('should throw InsufficientStockException when ADJUSTMENT negative delta exceeds stock', async () => {
    const lowStockProduct = new Product({
      id: 'prod-123',
      categoryId: 'cat-123',
      code: 'PROD-001',
      name: 'Test Product',
      salePrice: 100,
      costPrice: 50,
      currentStock: 3,
      isActive: true,
    });

    mockProductRepository.findById.mockResolvedValue(lowStockProduct);
    mockProductRepository.decrementStock.mockRejectedValue(
      new InsufficientStockException('Test Product', 10, 3),
    );

    const dto: AdjustStockDto = {
      type: StockMovementType.ADJUSTMENT,
      quantity: -10,
    };

    const command = new AdjustStockCommand('prod-123', dto);

    await expect(handler.execute(command)).rejects.toThrow(InsufficientStockException);
    expect(mockProductRepository.decrementStock).toHaveBeenCalledWith('prod-123', 10);
    expect(mockStockMovementRepository.create).not.toHaveBeenCalled();
  });

  it('should reject with BadRequestException when validator fails', async () => {
    mockValidator.validate.mockImplementation(() => {
      throw new BadRequestException('Quantity must not be zero');
    });

    const dto: AdjustStockDto = {
      type: StockMovementType.IN,
      quantity: 0,
    };

    const command = new AdjustStockCommand('prod-123', dto);

    await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
    expect(mockProductRepository.findById).not.toHaveBeenCalled();
  });
});
