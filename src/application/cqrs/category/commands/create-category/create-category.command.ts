export interface CreateCategoryPayload {
  name: string;
  description?: string;
  taxRateId: string;
}

export class CreateCategoryCommand {
  constructor(
    public readonly payload: CreateCategoryPayload,
  ) {}
}