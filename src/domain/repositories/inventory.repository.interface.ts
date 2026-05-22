import { Inventory } from '../entities';
import { PaginationParams, PaginatedResult } from './customer.repository.interface';

export interface InventoryFilters {
  warehouseId?: string;
  productId?: string;
}

export interface IInventoryRepository {
  findById(id: string): Promise<Inventory | null>;
  findByWarehouseAndProduct(warehouseId: string, productId: string): Promise<Inventory | null>;
  findByWarehouse(warehouseId: string): Promise<Inventory[]>;
  findAll(
    pagination?: PaginationParams,
    filters?: InventoryFilters,
  ): Promise<PaginatedResult<Inventory>>;
  create(inventory: Inventory): Promise<Inventory>;
  update(inventory: Inventory): Promise<Inventory>;
  updateStock(id: string, currentStock: number): Promise<Inventory>;
}