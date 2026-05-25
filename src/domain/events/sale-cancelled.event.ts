export class SaleCancelledEvent {
  saleId: string;
  cancelledAt: Date;

  constructor(saleId: string, cancelledAt: Date) {
    this.saleId = saleId;
    this.cancelledAt = cancelledAt;
  }
}