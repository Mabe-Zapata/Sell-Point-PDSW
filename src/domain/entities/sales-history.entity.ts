export class SalesHistory {
  id!: string;

  saleId!: string;

  originalCreatedAt!: Date;

  movedAt!: Date;

  constructor(partial: Partial<SalesHistory>) {
    Object.assign(this, partial);
  }
}
