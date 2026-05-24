export interface UpdateSaleDetailQuantityPayload {
  saleDetailId: string;
  quantity: number;
}

export class UpdateSaleDetailQuantityCommand {
  constructor(
    public readonly saleId: string,
    public readonly payload: UpdateSaleDetailQuantityPayload,
  ) {}
}