export interface UpdateTaxRatePayload {
  name?: string;
  percentage?: number;
  isActive?: boolean;
}

export class UpdateTaxRateCommand {
  constructor(
    public readonly id: string,
    public readonly payload: UpdateTaxRatePayload,
  ) {}
}