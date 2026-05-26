import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetDashboardStatsQuery } from '../../../../../application/cqrs/dashboard/queries/get-dashboard-stats/get-dashboard-stats.query';
import { GetDashboardStatsHandler as ApplicationGetDashboardStatsHandler } from '../../../../../application/cqrs/dashboard/queries/get-dashboard-stats/get-dashboard-stats.handler';
import { DASHBOARD_QUERY_SERVICE } from '../../../../../application/query-tokens';

@QueryHandler(GetDashboardStatsQuery)
export class GetDashboardStatsHandler implements IQueryHandler<GetDashboardStatsQuery> {
  private readonly appHandler: ApplicationGetDashboardStatsHandler;

  constructor(
    @Inject(DASHBOARD_QUERY_SERVICE) dashboardQueryService: any,
  ) {
    this.appHandler = new ApplicationGetDashboardStatsHandler(dashboardQueryService);
  }

  async execute(query: GetDashboardStatsQuery) {
    return this.appHandler.execute(query);
  }
}
