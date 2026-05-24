import { Sale, SaleDetail, Customer } from '../entities';

export interface SaleListItem {
  id: string;
  saleNumber: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  createdAt: Date;
  branchId: string;
  customerId: string;
  customerName: string;
  cashierUsername: string;
}

export interface SaleWithDetails extends Sale {
  details: SaleDetail[];
  customer: Customer;
  cashierUsername: string;
}

export interface ISaleQueryService {
  listSales(params: {
    page: number;
    limit: number;
    branchId?: string;
    customerId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: SaleListItem[]; total: number; page: number; limit: number }>;
  getSaleWithDetails(id: string): Promise<SaleWithDetails | null>;
}