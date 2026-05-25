import { ListProductsWithStockHandler } from './list-products-with-stock.handler';
import type { IProductQueryService } from '../../../../../domain/query-services/product.query-service.interface';
import { ListProductsWithStockQuery } from './list-products-with-stock.query';

describe('ListProductsWithStockHandler', () => {
  let handler: ListProductsWithStockHandler;
  let mockQueryService: jest.Mocked<IProductQueryService>;

  beforeEach(() => {
    mockQueryService = {
      listProducts: jest.fn(),
      getProductWithStock: jest.fn(),
    } as any;

    handler = new ListProductsWithStockHandler(mockQueryService);
  });

  it('should call queryService.listProducts with correct params', async () => {
    const mockResult = { data: [], total: 0, page: 1, limit: 20 };
    mockQueryService.listProducts.mockResolvedValue(mockResult);

    const pagination = { page: 1, limit: 20 };
    const query = new ListProductsWithStockQuery(pagination, 'test', undefined, true);

    const result = await handler.execute(query);

    expect(mockQueryService.listProducts).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      q: 'test',
      categoryId: undefined,
      isActive: true,
    });
    expect(result).toEqual(mockResult);
  });

  it('should pass pagination params correctly', async () => {
    const mockResult = { data: [], total: 0, page: 5, limit: 50 };
    mockQueryService.listProducts.mockResolvedValue(mockResult);

    const pagination = { page: 5, limit: 50 };
    const query = new ListProductsWithStockQuery(pagination, undefined, 'cat-123', false);

    await handler.execute(query);

    expect(mockQueryService.listProducts).toHaveBeenCalledWith({
      page: 5,
      limit: 50,
      q: undefined,
      categoryId: 'cat-123',
      isActive: false,
    });
  });
});
