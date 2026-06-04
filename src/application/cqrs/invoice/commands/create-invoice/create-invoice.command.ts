export class CreateInvoiceCommand {
  constructor(
    public readonly saleId: string,
    public readonly branchId: string,
    public readonly customerEmail?: string,
    public readonly customerName?: string,
    public readonly customerCedula?: string,
    public readonly cashierName?: string,
    public readonly cashierUsername?: string,
    public readonly cashierEmployeeId?: string,
  ) {}
}
