export interface CreateTransferPayload {
  fromBranchId: string;
  toBranchId: string;
  requesterUserId: string;
  notes?: string;
}

export class CreateTransferCommand {
  constructor(
    public readonly payload: CreateTransferPayload,
  ) {}
}