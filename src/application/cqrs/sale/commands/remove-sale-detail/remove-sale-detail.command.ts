import { ICommand } from '@nestjs/cqrs';

export interface RemoveSaleDetailPayload {
  saleId: string;
  saleDetailId: string;
}

export class RemoveSaleDetailCommand implements ICommand {
  constructor(public readonly payload: RemoveSaleDetailPayload) {}
}