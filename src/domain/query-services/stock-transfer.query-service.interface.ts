import { StockTransfer, StockTransferDetail } from '../entities';

export interface StockTransferListItem {
  id: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  requesterUserId: string;
  requesterUsername: string;
  approverUserId: string | null;
  approverUsername: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  details: StockTransferDetail[];
}

export interface IStockTransferQueryService {
  listTransfers(params: {
    page: number;
    limit: number;
    fromBranchId?: string;
    toBranchId?: string;
    status?: string;
  }): Promise<{ data: StockTransferListItem[]; total: number; page: number; limit: number }>;
  getTransferWithDetails(id: string): Promise<StockTransferListItem | null>;
}