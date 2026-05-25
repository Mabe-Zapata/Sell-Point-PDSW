import type {
  ISaleRepository,
  ISaleDetailRepository,
  IProductRepository,
  IStockMovementRepository,
} from '../../domain/repositories';

export interface IUnitOfWork {
  start(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  dispatchEvent(event: any): void; // DomainEvent
  sales: ISaleRepository;
  saleDetails: ISaleDetailRepository;
  products: IProductRepository;
  stockMovements: IStockMovementRepository;
}
