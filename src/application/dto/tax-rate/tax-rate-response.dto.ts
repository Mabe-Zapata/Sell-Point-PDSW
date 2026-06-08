import { TaxRate } from '../../../domain/entities/tax-rate.entity';

export class TaxRateResponseDto {
  id: string;
  name: string;
  percentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(taxRate: TaxRate) {
    this.id = taxRate.id;
    this.name = taxRate.name;
    this.percentage = taxRate.percentage;
    this.isActive = taxRate.isActive;
    this.createdAt = taxRate.createdAt;
    this.updatedAt = taxRate.updatedAt;
  }

  static fromEntity(taxRate: TaxRate): TaxRateResponseDto {
    return new TaxRateResponseDto(taxRate);
  }

  static fromEntities(taxRates: TaxRate[]): TaxRateResponseDto[] {
    return taxRates.map((t) => new TaxRateResponseDto(t));
  }
}

