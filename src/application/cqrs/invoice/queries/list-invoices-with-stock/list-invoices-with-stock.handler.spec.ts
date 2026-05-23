import { Test, TestingModule } from '@nestjs/testing';
import { ListInvoicesWithStockHandler } from './list-invoices-with-stock.handler';
import { ListInvoicesWithStockValidator } from './list-invoices-with-stock.validator';
import { INVOICE_QUERY_SERVICE } from '../../../../query-tokens';
import type { IInvoiceQueryService } from '../../../../../domain/query-services/invoice.query-service.interface';
import { ListInvoicesWithStockQuery } from './list-invoices-with-stock.query';

describe('ListInvoicesWithStockHandler', () => {
  let handler: ListInvoicesWithStockHandler;
  let mockQueryService: jest.Mocked<IInvoiceQueryService>;

  beforeEach(async () => {
    mockQueryService = {
      listInvoices: jest.fn(),
      getInvoiceBySaleId: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListInvoicesWithStockHandler,
        ListInvoicesWithStockValidator,
        { provide: INVOICE_QUERY_SERVICE, useValue: mockQueryService },
      ],
    }).compile();

    handler = module.get<ListInvoicesWithStockHandler>(ListInvoicesWithStockHandler);
  });

  it('should call queryService.listInvoices with correct params', async () => {
    const mockResult = { data: [], total: 0, page: 1, limit: 20 };
    mockQueryService.listInvoices.mockResolvedValue(mockResult);

    const pagination = { page: 1, limit: 20 };
    const query = new ListInvoicesWithStockQuery(
      pagination,
      'branch-123',
      'ACTIVE',
      '001-001-0000001',
      new Date('2024-01-01'),
      new Date('2024-12-31'),
    );

    const result = await handler.execute(query);

    expect(mockQueryService.listInvoices).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      branchId: 'branch-123',
      status: 'ACTIVE',
      invoiceNumber: '001-001-0000001',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });
    expect(result).toEqual(mockResult);
  });

  it('should work without optional filters', async () => {
    const mockResult = { data: [], total: 0, page: 1, limit: 20 };
    mockQueryService.listInvoices.mockResolvedValue(mockResult);

    const query = new ListInvoicesWithStockQuery();

    await handler.execute(query);

    expect(mockQueryService.listInvoices).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      branchId: undefined,
      status: undefined,
      invoiceNumber: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  });
});