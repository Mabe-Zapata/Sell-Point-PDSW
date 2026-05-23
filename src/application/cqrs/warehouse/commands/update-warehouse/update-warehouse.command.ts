export interface UpdateWarehousePayload {
  name?: string;
  isMain?: boolean;
  isActive?: boolean;
}

export class UpdateWarehouseCommand {
  constructor(
    public readonly id: string,
    public readonly payload: UpdateWarehousePayload,
  ) {}
}