import { ICommand } from '@nestjs/cqrs';

export interface UpdateSaleDetailQuantityPayload {
  saleId: string;
  saleDetailId: string;
  quantity: number;
}

export class UpdateSaleDetailQuantityCommand implements ICommand {
  constructor(public readonly payload: UpdateSaleDetailQuantityPayload) {}
}