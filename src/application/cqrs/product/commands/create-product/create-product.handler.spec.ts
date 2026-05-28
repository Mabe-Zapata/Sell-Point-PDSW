import { CreateProductHandler } from './create-product.handler';
import { Product } from '../../../../../domain/entities/product.entity';

describe('CreateProductHandler (application layer)', () => {
  // The application-layer handler takes repositories as plain constructor args
  // (not NestJS-injected), so we instantiate it directly with mocks.
  let mockCategoryRepository: any;
  let mockProductRepository: any;
  let mockStockMovementRepository: any;
  let handler: CreateProductHandler;

  beforeEach(() => {
    mockCategoryRepository = {
      findById: jest.fn(),
    };
    mockProductRepository = {
      getNextCode: jest.fn(),
      create: jest.fn(),
    };
    mockStockMovementRepository = {
      create: jest.fn(),
    };

    handler = new CreateProductHandler(
      mockCategoryRepository,
      mockProductRepository,
      mockStockMovementRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create product and call repository.create', async () => {
      const mockCategory = { id: 'cat-123' };
      const generatedCode = 'PROD-ABCDEF1234567890';
      const mockProduct = {
        id: 'prod-123',
        categoryId: 'cat-123',
        code: generatedCode,
        name: 'Test Product',
        description: 'Test description',
        salePrice: 100,
        costPrice: 50,
        isActive: true,
      } as Product;

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockProductRepository.getNextCode.mockResolvedValue(generatedCode);
      mockProductRepository.create.mockResolvedValue(mockProduct);

      const dto = {
        categoryId: 'cat-123',
        name: 'Test Product',
        description: 'Test description',
        salePrice: 100,
        costPrice: 50,
        isActive: true,
      };

      const result = await handler.execute({ payload: dto } as any);

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('cat-123');
      expect(mockProductRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    it('should set isActive to true by default when not provided', async () => {
      const mockCategory = { id: 'cat-123' };
      const generatedCode = 'PROD-ABCDEF1234567890';
      const mockProduct = {
        id: 'prod-123',
        categoryId: 'cat-123',
        code: generatedCode,
        name: 'Test Product',
        salePrice: 100,
        costPrice: 50,
        isActive: true,
      } as Product;

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockProductRepository.getNextCode.mockResolvedValue(generatedCode);
      mockProductRepository.create.mockResolvedValue(mockProduct);

      const dto = {
        categoryId: 'cat-123',
        name: 'Test Product',
        salePrice: 100,
        costPrice: 50,
      };

      const result = await handler.execute({ payload: dto } as any);

      expect(mockProductRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
      );
      expect(result).toEqual(mockProduct);
    });
  });
});
