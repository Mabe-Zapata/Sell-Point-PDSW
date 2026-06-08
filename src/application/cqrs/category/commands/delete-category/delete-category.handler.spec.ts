import { DeleteCategoryHandler } from './delete-category.handler';
import type { ICategoryRepository, IProductRepository } from '../../../../../domain/repositories';
import { Category } from '../../../../../domain/entities/category.entity';
import { DeleteCategoryCommand } from './delete-category.command';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';

describe('DeleteCategoryHandler', () => {
  let handler: DeleteCategoryHandler;
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>;
  let mockProductRepository: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    mockCategoryRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    mockProductRepository = {
      findAll: jest.fn(),
    } as any;

    handler = new DeleteCategoryHandler(mockCategoryRepository, mockProductRepository);
  });

  it('should physically delete category when no products are associated', async () => {
    const mockCategory = new Category({
      id: 'cat-123',
      name: 'Test Category',
      taxRateId: 'tax-15',
      isActive: true,
    });

    mockCategoryRepository.findById.mockResolvedValue(mockCategory);
    mockProductRepository.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 1 });
    mockCategoryRepository.softDelete.mockResolvedValue(undefined);

    const command = new DeleteCategoryCommand('cat-123');
    await handler.execute(command);

    expect(mockCategoryRepository.findById).toHaveBeenCalledWith('cat-123');
    expect(mockProductRepository.findAll).toHaveBeenCalledWith(
      { page: 1, limit: 1 },
      { categoryId: 'cat-123' }
    );
    expect(mockCategoryRepository.softDelete).toHaveBeenCalledWith('cat-123');
  });

  it('should throw EntityNotFoundException if category does not exist', async () => {
    mockCategoryRepository.findById.mockResolvedValue(null);

    const command = new DeleteCategoryCommand('non-existent');
    await expect(handler.execute(command)).rejects.toThrow(EntityNotFoundException);
  });

  it('should throw BusinessRuleException if category is associated with products', async () => {
    const mockCategory = new Category({
      id: 'cat-123',
      name: 'Test Category',
      taxRateId: 'tax-15',
      isActive: true,
    });

    mockCategoryRepository.findById.mockResolvedValue(mockCategory);
    mockProductRepository.findAll.mockResolvedValue({
      data: [{ id: 'prod-123' }] as any,
      total: 1,
      page: 1,
      limit: 1,
    });

    const command = new DeleteCategoryCommand('cat-123');
    await expect(handler.execute(command)).rejects.toThrow(BusinessRuleException);
    expect(mockCategoryRepository.softDelete).not.toHaveBeenCalled();
  });
});
