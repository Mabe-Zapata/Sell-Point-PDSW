import { Injectable } from '@nestjs/common';
import { DashboardRepository } from '../../../infrastructure/repositories/dashboard.repository';
import { DashboardStatsDto } from '../../dto/dashboard/dashboard-stats.dto';

@Injectable()
export class GetDashboardStatsUseCase {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async execute(): Promise<DashboardStatsDto> {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // getMonth() returns 0-11

    const [
      totalClientes,
      totalProductos,
      totalFacturas,
      ventasDelDia,
      ventasDelMes,
      productosConStockBajo,
    ] = await Promise.all([
      this.dashboardRepository.countActiveCustomers(),
      this.dashboardRepository.countActiveProducts(),
      this.dashboardRepository.countActiveInvoices(),
      this.dashboardRepository.sumSalesByDate(today),
      this.dashboardRepository.sumSalesByMonth(year, month),
      this.dashboardRepository.countProductsWithLowStock(),
    ]);

    return new DashboardStatsDto({
      totalClientes,
      totalProductos,
      totalFacturas,
      ventasDelDia,
      ventasDelMes,
      productosConStockBajo,
    });
  }
}