import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

import { GetDashboardStatsQuery } from '../../application/cqrs/dashboard/queries/get-dashboard-stats/get-dashboard-stats.query';
import { DashboardStatsDto } from '../../application/dto/dashboard/dashboard-stats.dto';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('estadisticas')
  @ApiOperation({
    summary: 'Get dashboard KPI cards',
    description:
      'Returns the canonical Spanish KPI payload for the dashboard cards: ventasDelDia, ventasDelMes, totalFacturas, and productosConStockBajo.',
  })
  @ApiQuery({ name: 'branchId', description: 'Filter by branch UUID', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto,
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getEstadisticas(
    @Query('branchId') branchId?: string,
  ): Promise<DashboardStatsDto> {
    const stats = await this.queryBus.execute(new GetDashboardStatsQuery(branchId));
    return stats;
  }
}
