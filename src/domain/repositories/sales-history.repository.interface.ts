import { SalesHistory } from '../entities';
import { PaginationParams, PaginatedResult } from './customer.repository.interface';

export interface ISalesHistoryRepository {
  findById(id: string): Promise<SalesHistory | null>;
  findBySaleId(saleId: string): Promise<SalesHistory | null>;
  create(salesHistory: SalesHistory): Promise<SalesHistory>;
}