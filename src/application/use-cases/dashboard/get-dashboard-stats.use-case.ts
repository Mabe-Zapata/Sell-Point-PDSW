import { DashboardRepository } from '../../../infrastructure/repositories/dashboard.repository';
import { DashboardStatsDto } from '../../dto/dashboard/dashboard-stats.dto';

export class GetDashboardStatsUseCase {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async execute(): Promise<DashboardStatsDto> {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // getMonth() returns 0-11

    const [
      totalFacturas,
      ventasDelDia,
      ventasDelMes,
      productosConStockBajo,
    ] = await Promise.all([
      this.dashboardRepository.countActiveInvoices(),
      this.dashboardRepository.sumSalesByDate(today),
      this.dashboardRepository.sumSalesByMonth(year, month),
      this.dashboardRepository.countProductsWithLowStock(),
    ]);

    return new DashboardStatsDto({
      ventasDelDia,
      ventasDelMes,
      totalFacturas,
      productosConStockBajo,
    });
  }
}
