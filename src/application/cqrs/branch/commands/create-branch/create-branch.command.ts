export interface CreateBranchPayload {
  name: string;
  city?: string;
  address?: string;
  phone?: string;
}

export class CreateBranchCommand {
  constructor(
    public readonly payload: CreateBranchPayload,
  ) {}
}