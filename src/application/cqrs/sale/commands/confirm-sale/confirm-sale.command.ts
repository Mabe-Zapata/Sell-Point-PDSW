export class ConfirmSaleCommand {
  constructor(
    public readonly saleId: string,
    public readonly idempotencyKey?: string,
  ) {}
}
