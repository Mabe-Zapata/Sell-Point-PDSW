/**
 * Dashboard repository interface
 * Defines the contract for dashboard statistics data access operations
 */
export interface IDashboardRepository {
  /**
   * Count all active customers (without soft delete)
   */
  countActiveCustomers(): Promise<number>;

  /**
   * Count all active products (without soft delete)
   */
  countActiveProducts(): Promise<number>;

  /**
   * Count all active invoices (without soft delete)
   */
  countActiveInvoices(): Promise<number>;

  /**
   * Sum total sales amount for a specific date
   * @param date Date object
   */
  sumSalesByDate(date: Date): Promise<number>;

  /**
   * Sum total sales amount for a specific month
   * @param year Year (e.g., 2024)
   * @param month Month (1-12)
   */
  sumSalesByMonth(year: number, month: number): Promise<number>;

  /**
   * Count products with stock below 10 units
   */
  countProductsWithLowStock(): Promise<number>;
}