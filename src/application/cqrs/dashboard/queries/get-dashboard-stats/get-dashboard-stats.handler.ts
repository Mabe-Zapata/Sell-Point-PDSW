import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetDashboardStatsQuery } from './get-dashboard-stats.query';
import { DASHBOARD_QUERY_SERVICE } from '../../../../query-tokens';
import type { IDashboardQueryService } from '../../../../../domain/query-services/dashboard.query-service.interface';

@QueryHandler(GetDashboardStatsQuery)
export class GetDashboardStatsHandler implements IQueryHandler<GetDashboardStatsQuery> {
  constructor(
    @Inject(DASHBOARD_QUERY_SERVICE) private readonly dashboardQueryService: IDashboardQueryService,
  ) {}

  async execute(query: GetDashboardStatsQuery) {
    return this.dashboardQueryService.getStats(query.branchId);
  }
}