export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export class UpdateCategoryCommand {
  constructor(
    public readonly id: string,
    public readonly payload: UpdateCategoryPayload,
  ) {}
}