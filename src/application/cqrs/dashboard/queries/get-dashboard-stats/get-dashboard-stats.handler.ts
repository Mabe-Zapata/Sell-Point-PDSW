import { GetDashboardStatsQuery } from './get-dashboard-stats.query';
import { DashboardStatsDto } from '../../../../dto/dashboard/dashboard-stats.dto';
import type { IDashboardQueryService } from '../../../../../domain/query-services/dashboard.query-service.interface';

export class GetDashboardStatsHandler {
  constructor(
    protected readonly dashboardQueryService: IDashboardQueryService,
  ) {}

  async execute(query: GetDashboardStatsQuery): Promise<DashboardStatsDto> {
    const stats = await this.dashboardQueryService.getStats(query.branchId);
    return new DashboardStatsDto(stats);
  }
}
