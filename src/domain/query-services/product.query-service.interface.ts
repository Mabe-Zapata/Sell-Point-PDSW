import { Product, Category } from '../entities';

export interface ProductListItem {
  id: string;
  code: string;
  name: string;
  salePrice: number;
  costPrice: number;
  currentStock: number;
  categoryId: string;
  categoryName: string;
  isActive: boolean;
}

export interface IProductQueryService {
  listProducts(params: {
    page: number;
    limit: number;
    q?: string;
    categoryId?: string;
    isActive?: boolean;
  }): Promise<{ data: ProductListItem[]; total: number; page: number; limit: number }>;
  getProductWithStock(id: string): Promise<(ProductListItem & { warehouseStock: { warehouseId: string; warehouseName: string; currentStock: number }[] }) | null>;
}