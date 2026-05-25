import { Test, TestingModule } from '@nestjs/testing';
import { DeleteCategoryHandler } from './delete-category.handler';
import { DeleteCategoryValidator } from './delete-category.validator';
import { CATEGORY_REPOSITORY, PRODUCT_REPOSITORY } from '../../../../tokens';
import type { ICategoryRepository, IProductRepository } from '../../../../../domain/repositories';
import { Category } from '../../../../../domain/entities/category.entity';
import { DeleteCategoryCommand } from './delete-category.command';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';

describe('DeleteCategoryHandler', () => {
  let handler: DeleteCategoryHandler;
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockValidator: DeleteCategoryValidator;

  beforeEach(async () => {
    mockCategoryRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    mockProductRepository = {
      findAll: jest.fn(),
    } as any;

    mockValidator = {
      validate: jest.fn((id) => id),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCategoryHandler,
        { provide: DeleteCategoryValidator, useValue: mockValidator },
        { provide: CATEGORY_REPOSITORY, useValue: mockCategoryRepository },
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
      ],
    }).compile();

    handler = module.get<DeleteCategoryHandler>(DeleteCategoryHandler);
  });

  it('should physically delete category when no products are associated', async () => {
    const mockCategory = new Category({
      id: 'cat-123',
      name: 'Test Category',
      isActive: true,
    });

    mockCategoryRepository.findById.mockResolvedValue(mockCategory);
    mockProductRepository.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 1 });
    mockCategoryRepository.softDelete.mockResolvedValue(undefined);

    const command = new DeleteCategoryCommand('cat-123');
    await handler.execute(command);

    expect(mockValidator.validate).toHaveBeenCalledWith('cat-123');
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
