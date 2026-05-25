import { Test, TestingModule } from '@nestjs/testing';
import { GetDashboardStatsHandler } from './get-dashboard-stats.handler';
import { DASHBOARD_QUERY_SERVICE } from '../../../../query-tokens';
import type { IDashboardQueryService } from '../../../../../domain/query-services/dashboard.query-service.interface';
import { GetDashboardStatsQuery } from './get-dashboard-stats.query';

describe('GetDashboardStatsHandler', () => {
  let handler: GetDashboardStatsHandler;
  let mockQueryService: jest.Mocked<IDashboardQueryService>;

  beforeEach(async () => {
    mockQueryService = {
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDashboardStatsHandler,
        { provide: DASHBOARD_QUERY_SERVICE, useValue: mockQueryService },
      ],
    }).compile();

    handler = module.get<GetDashboardStatsHandler>(GetDashboardStatsHandler);
  });

  it('should call queryService.getStats without branchId', async () => {
    const mockStats = {
      totalSales: 100,
      totalRevenue: 50000,
      totalCustomers: 50,
      totalProducts: 200,
      salesByBranch: [],
      topProducts: [],
      recentSales: [],
    };
    mockQueryService.getStats.mockResolvedValue(mockStats);

    const query = new GetDashboardStatsQuery();
    const result = await handler.execute(query);

    expect(mockQueryService.getStats).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(mockStats);
  });

  it('should call queryService.getStats with branchId', async () => {
    const mockStats = {
      totalSales: 50,
      totalRevenue: 25000,
      totalCustomers: 25,
      totalProducts: 100,
      salesByBranch: [],
      topProducts: [],
      recentSales: [],
    };
    mockQueryService.getStats.mockResolvedValue(mockStats);

    const query = new GetDashboardStatsQuery('branch-123');
    const result = await handler.execute(query);

    expect(mockQueryService.getStats).toHaveBeenCalledWith('branch-123');
    expect(result).toEqual(mockStats);
  });
});