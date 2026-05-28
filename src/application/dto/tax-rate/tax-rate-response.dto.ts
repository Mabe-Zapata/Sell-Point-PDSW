import { ApiProperty } from '@nestjs/swagger';
import { TaxRate } from '../../../domain/entities/tax-rate.entity';

export class TaxRateResponseDto {
  @ApiProperty({ description: 'Tax rate UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Tax rate name', example: 'IVA 15%' })
  name: string;

  @ApiProperty({ description: 'Tax percentage', example: 15 })
  percentage: number;

  @ApiProperty({ description: 'Active status', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
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
