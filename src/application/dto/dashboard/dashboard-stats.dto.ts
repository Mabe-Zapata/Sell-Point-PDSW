
export class DashboardStatsDto {
  totalClientes: number;
  totalProductos: number;
  totalFacturas: number;
  ventasDelDia: number;
  ventasDelMes: number;
  productosConStockBajo: number;

  constructor(partial: Partial<DashboardStatsDto>) {
    Object.assign(this, partial);
  }
}
