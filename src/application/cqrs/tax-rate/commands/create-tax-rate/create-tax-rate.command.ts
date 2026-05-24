export interface CreateTaxRatePayload {
  name: string;
  percentage: number;
  isActive?: boolean;
}

export class CreateTaxRateCommand {
  constructor(
    public readonly payload: CreateTaxRatePayload,
  ) {}
}