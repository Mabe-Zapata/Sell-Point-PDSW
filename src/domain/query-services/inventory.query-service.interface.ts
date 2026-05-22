import { Inventory, StockMovement } from '../entities';

export interface StockLevel {
  inventoryId: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productCode: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
}

export interface MovementHistory {
  id: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  type: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  userId: string | null;
  userUsername: string | null;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: Date;
}

export interface IInventoryQueryService {
  getStockLevels(params: {
    page: number;
    limit: number;
    warehouseId?: string;
    productId?: string;
    belowMinimum?: boolean;
  }): Promise<{ data: StockLevel[]; total: number; page: number; limit: number }>;
  getMovementsHistory(params: {
    page: number;
    limit: number;
    warehouseId?: string;
    productId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: MovementHistory[]; total: number; page: number; limit: number }>;
}