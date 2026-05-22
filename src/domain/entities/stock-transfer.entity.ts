import { TransferStatus } from './enums';

export class StockTransfer {
  id!: string;

  fromBranchId!: string;

  toBranchId!: string;

  requesterUserId!: string;

  approverUserId?: string;

  status!: TransferStatus;

  notes?: string;

  createdAt!: Date;

  updatedAt!: Date;

  constructor(partial: Partial<StockTransfer>) {
    Object.assign(this, partial);
  }
}
