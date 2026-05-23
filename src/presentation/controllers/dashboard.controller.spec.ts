import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { DashboardController } from './dashboard.controller';
import { GetDashboardStatsQuery } from '../../application/cqrs/dashboard/queries/get-dashboard-stats/get-dashboard-stats.query';

describe('DashboardController', () => {
  let controller: DashboardController;
  let mockQueryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    mockQueryBus = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: QueryBus, useValue: mockQueryBus }],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  describe('getEstadisticas', () => {
    it('should call queryBus.execute with GetDashboardStatsQuery without branchId', async () => {
      const mockStats = {
        totalSales: 100,
        totalRevenue: 50000,
        totalCustomers: 50,
        totalProducts: 200,
        salesByBranch: [],
        topProducts: [],
        recentSales: [],
      };
      mockQueryBus.execute.mockResolvedValue(mockStats);

      const result = await controller.getEstadisticas();

      expect(mockQueryBus.execute).toHaveBeenCalledWith(new GetDashboardStatsQuery(undefined));
      expect(result).toEqual(mockStats);
    });

    it('should call queryBus.execute with GetDashboardStatsQuery with branchId', async () => {
      const mockStats = {
        totalSales: 50,
        totalRevenue: 25000,
        totalCustomers: 25,
        totalProducts: 100,
        salesByBranch: [],
        topProducts: [],
        recentSales: [],
      };
      mockQueryBus.execute.mockResolvedValue(mockStats);

      const result = await controller.getEstadisticas('branch-123');

      expect(mockQueryBus.execute).toHaveBeenCalledWith(new GetDashboardStatsQuery('branch-123'));
      expect(result).toEqual(mockStats);
    });
  });
});