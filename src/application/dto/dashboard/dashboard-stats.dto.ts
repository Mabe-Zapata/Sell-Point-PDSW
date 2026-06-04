export class DashboardStatsDto {
  ventasDelDia: number;
  ventasDelMes: number;
  totalFacturas: number;
  productosConStockBajo: number;

  constructor(partial: Partial<DashboardStatsDto>) {
    Object.assign(this, partial);
  }
}
