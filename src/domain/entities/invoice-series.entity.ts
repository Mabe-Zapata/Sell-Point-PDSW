export class InvoiceSeries {
  id!: string;
  branchId!: string;
  establishmentCode!: string;
  emissionPointCode!: string;
  sequenceNumber!: number;
  currentSequence!: number;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<InvoiceSeries>) {
    Object.assign(this, partial);
  }
}