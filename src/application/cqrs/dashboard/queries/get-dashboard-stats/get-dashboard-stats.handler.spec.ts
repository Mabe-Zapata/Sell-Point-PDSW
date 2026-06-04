import { GetDashboardStatsHandler } from './get-dashboard-stats.handler';
import type { IDashboardQueryService } from '../../../../../domain/query-services/dashboard.query-service.interface';
import { GetDashboardStatsQuery } from './get-dashboard-stats.query';

describe('GetDashboardStatsHandler', () => {
  let handler: GetDashboardStatsHandler;
  let mockQueryService: jest.Mocked<IDashboardQueryService>;

  beforeEach(() => {
    mockQueryService = {
      getStats: jest.fn(),
    };

    handler = new GetDashboardStatsHandler(mockQueryService);
  });

  it('should call queryService.getStats without branchId', async () => {
    const mockStats = {
      ventasDelDia: 100,
      ventasDelMes: 500,
      totalFacturas: 12,
      productosConStockBajo: 3,
    };
    mockQueryService.getStats.mockResolvedValue(mockStats);

    const query = new GetDashboardStatsQuery();
    const result = await handler.execute(query);

    expect(mockQueryService.getStats).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(mockStats);
  });

  it('should call queryService.getStats with branchId', async () => {
    const mockStats = {
      ventasDelDia: 50,
      ventasDelMes: 250,
      totalFacturas: 6,
      productosConStockBajo: 1,
    };
    mockQueryService.getStats.mockResolvedValue(mockStats);

    const query = new GetDashboardStatsQuery('branch-123');
    const result = await handler.execute(query);

    expect(mockQueryService.getStats).toHaveBeenCalledWith('branch-123');
    expect(result).toEqual(mockStats);
  });
});
