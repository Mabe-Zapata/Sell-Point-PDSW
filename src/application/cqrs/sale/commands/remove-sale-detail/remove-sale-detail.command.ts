export class RemoveSaleDetailCommand {
  constructor(
    public readonly saleId: string,
    public readonly saleDetailId: string,
  ) {}
}