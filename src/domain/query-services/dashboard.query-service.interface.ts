export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  salesByBranch: { branchId: string; branchName: string; total: number }[];
  topProducts: { productId: string; productName: string; quantitySold: number }[];
  recentSales: { id: string; saleNumber: string; total: number; createdAt: Date }[];
}

export interface IDashboardQueryService {
  getStats(branchId?: string): Promise<DashboardStats>;
}