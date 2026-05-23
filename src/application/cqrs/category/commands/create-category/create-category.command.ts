export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export class CreateCategoryCommand {
  constructor(
    public readonly payload: CreateCategoryPayload,
  ) {}
}