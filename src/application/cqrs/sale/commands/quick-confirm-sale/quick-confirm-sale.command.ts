import { ICommand } from '@nestjs/cqrs';

export interface QuickConfirmSaleDetail {
  productId: string;
  quantity: number;
}

export interface QuickConfirmSalePayload {
  customerId: string | null;
  details: QuickConfirmSaleDetail[];
  idempotencyKey?: string;
  cashierUserId: string;
}

export class QuickConfirmSaleCommand implements ICommand {
  constructor(public readonly payload: QuickConfirmSalePayload) {}
}
