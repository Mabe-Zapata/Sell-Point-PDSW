export class InvoiceItemLot {
  id!: string;
  invoiceItemId!: string;
  lotId!: string;
  lotCode?: string;
  quantityUsed!: number;
  unitCostSnapshot!: number;
  profitAmount!: number;
  createdAt!: Date;

  constructor(partial: Partial<InvoiceItemLot>) {
    Object.assign(this, partial);
  }
}
