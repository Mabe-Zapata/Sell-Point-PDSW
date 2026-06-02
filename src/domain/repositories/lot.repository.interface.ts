import { Lot } from '../entities/lot.entity';

export interface ILotRepository {
  create(lot: Lot): Promise<Lot>;
  findById(id: string): Promise<Lot | null>;
  findActiveByProductId(productId: string): Promise<Lot[]>;
  findActiveByProductIdForUpdate(productId: string): Promise<Lot[]>;
  update(lot: Lot): Promise<Lot>;
  setQuantityAvailable(id: string, quantityAvailable: number): Promise<void>;
  softDelete(id: string): Promise<void>;
  recalculateEstimatedProfit(productId: string, salePrice: number): Promise<void>;
}
