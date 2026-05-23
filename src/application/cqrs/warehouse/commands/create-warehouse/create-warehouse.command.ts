export interface CreateWarehousePayload {
  branchId: string;
  name: string;
  isMain?: boolean;
}

export class CreateWarehouseCommand {
  constructor(
    public readonly payload: CreateWarehousePayload,
  ) {}
}