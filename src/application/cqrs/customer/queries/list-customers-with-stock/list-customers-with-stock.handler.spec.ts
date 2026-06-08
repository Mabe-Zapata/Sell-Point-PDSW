import { ListCustomersWithStockHandler } from './list-customers-with-stock.handler';
import type { ICustomerQueryService } from '../../../../../domain/query-services/customer.query-service.interface';
import { ListCustomersWithStockQuery } from './list-customers-with-stock.query';

describe('ListCustomersWithStockHandler', () => {
  let handler: ListCustomersWithStockHandler;
  let mockQueryService: jest.Mocked<ICustomerQueryService>;

  beforeEach(() => {
    mockQueryService = {
      listCustomers: jest.fn(),
      getCustomerByIdentification: jest.fn(),
    };

    handler = new ListCustomersWithStockHandler(mockQueryService);
  });

  it('should call queryService.listCustomers with correct params', async () => {
    const mockResult = { data: [], total: 0, page: 1, limit: 20 };
    mockQueryService.listCustomers.mockResolvedValue(mockResult);

    const pagination = { page: 1, limit: 20 };
    const query = new ListCustomersWithStockQuery(pagination, 'john', '9999999999999');

    const result = await handler.execute(query);

    expect(mockQueryService.listCustomers).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      q: 'john',
      cedula: '9999999999999',
    });
    expect(result).toEqual(mockResult);
  });

  it('should use default pagination when not provided', async () => {
    const mockResult = { data: [], total: 0, page: 1, limit: 20 };
    mockQueryService.listCustomers.mockResolvedValue(mockResult);

    const query = new ListCustomersWithStockQuery();

    await handler.execute(query);

    expect(mockQueryService.listCustomers).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      q: undefined,
      identificationType: undefined,
    });
  });
});
