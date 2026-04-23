import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { GetDashboardStatsUseCase } from '../../application/use-cases/dashboard/get-dashboard-stats.use-case';
import { DashboardStatsDto } from '../../application/dto/dashboard/dashboard-stats.dto';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase) {}

  @Get('estadisticas')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Retrieves real-time statistics for the dashboard including total customers, products, invoices, daily and monthly sales, and low stock products.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto,
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getEstadisticas(): Promise<DashboardStatsDto> {
    return this.getDashboardStatsUseCase.execute();
  }
}