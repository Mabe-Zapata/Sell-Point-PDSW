export class CreateInvoiceCommand {
  constructor(
    public readonly saleId: string,
    public readonly branchId: string,
    public readonly customerEmail?: string,
    public readonly customerName?: string,
  ) {}
}
