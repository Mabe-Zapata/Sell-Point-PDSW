import type {
  ISaleRepository,
  ISaleDetailRepository,
  IProductRepository,
  IStockMovementRepository,
  IInvoiceRepository,
  IInvoiceItemRepository,
  IInvoiceSeriesRepository,
  IInvoiceItemLotRepository,
  ILotRepository,
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
  invoices: IInvoiceRepository;
  invoiceItems: IInvoiceItemRepository;
  invoiceItemLots: IInvoiceItemLotRepository;
  invoiceSeries: IInvoiceSeriesRepository;
  lots: ILotRepository;
}
