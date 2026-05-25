import { AdjustStockHandler } from './adjust-stock.handler';
import type { IProductRepository } from '../../../../../domain/repositories/product.repository.interface';
import type { IStockMovementRepository } from '../../../../../domain/repositories/stock-movement.repository.interface';
import { StockMovementType } from '../../../../../domain/entities/enums/stock-movement-type.enum';
import { Product } from '../../../../../domain/entities/product.entity';
import { StockMovement } from '../../../../../domain/entities/stock-movement.entity';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { InsufficientStockException } from '../../../../../domain/exceptions/insufficient-stock.exception';
import { AdjustStockCommand } from './adjust-stock.command';
import { AdjustStockDto } from '../../../../dto/stock/adjust-stock.dto';

describe('AdjustStockHandler', () => {
  let handler: AdjustStockHandler;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockStockMovementRepository: jest.Mocked<IStockMovementRepository>;

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

  beforeEach(() => {
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

    handler = new AdjustStockHandler(mockProductRepository, mockStockMovementRepository);
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
  });

  it('should throw EntityNotFoundException when product does not exist', async () => {
    mockProductRepository.findById.mockResolvedValue(null);

    const dto: AdjustStockDto = {
      type: StockMovementType.IN,
      quantity: 5,
    };

    const command = new AdjustStockCommand('non-existent', dto);
    await expect(handler.execute(command)).rejects.toThrow(EntityNotFoundException);
  });
});
