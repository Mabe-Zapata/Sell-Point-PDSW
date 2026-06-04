export interface DashboardStats {
  ventasDelDia: number;
  ventasDelMes: number;
  totalFacturas: number;
  productosConStockBajo: number;
}

export interface IDashboardQueryService {
  getStats(branchId?: string): Promise<DashboardStats>;
}
