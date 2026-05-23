export interface UpdateBranchPayload {
  name?: string;
  city?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

export class UpdateBranchCommand {
  constructor(
    public readonly id: string,
    public readonly payload: UpdateBranchPayload,
  ) {}
}