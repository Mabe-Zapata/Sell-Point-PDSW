import { GetDashboardStatsQuery } from './get-dashboard-stats.query';
import { DASHBOARD_QUERY_SERVICE } from '../../../../query-tokens';
import type { IDashboardQueryService } from '../../../../../domain/query-services/dashboard.query-service.interface';export class GetDashboardStatsHandler {
  constructor(
    protected readonly dashboardQueryService: IDashboardQueryService,
  ) {}

  async execute(query: GetDashboardStatsQuery) {
    return this.dashboardQueryService.getStats(query.branchId);
  }
}