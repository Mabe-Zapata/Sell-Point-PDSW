import { ICommand } from '@nestjs/cqrs';

export interface AddSaleDetailPayload {
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export class AddSaleDetailCommand implements ICommand {
  constructor(public readonly payload: AddSaleDetailPayload) {}
}