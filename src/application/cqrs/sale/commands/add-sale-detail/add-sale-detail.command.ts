export interface AddSaleDetailPayload {
  saleId: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
}

export class AddSaleDetailCommand {
  constructor(
    public readonly payload: AddSaleDetailPayload,
  ) {}
}