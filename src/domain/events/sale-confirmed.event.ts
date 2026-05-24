export class SaleConfirmedEvent {
  saleId: string;
  confirmedAt: Date;
  total: number;

  constructor(saleId: string, confirmedAt: Date, total: number) {
    this.saleId = saleId;
    this.confirmedAt = confirmedAt;
    this.total = total;
  }
}