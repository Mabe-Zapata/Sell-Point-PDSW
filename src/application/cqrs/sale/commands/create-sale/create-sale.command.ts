export interface CreateSalePayload {
  branchId: string;
  customerId: string;
  cashierUserId: string;
  taxRateId: string;
}

export class CreateSaleCommand {
  constructor(
    public readonly payload: CreateSalePayload,
  ) {}
}