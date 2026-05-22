export class StockTransferDetail {
  id!: string;

  stockTransferId!: string;

  productId!: string;

  quantity!: number;

  createdAt!: Date;

  constructor(partial: Partial<StockTransferDetail>) {
    Object.assign(this, partial);
  }
}
