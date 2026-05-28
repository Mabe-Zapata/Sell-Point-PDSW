import { SaleDetail } from '../../../domain/entities/sale-detail.entity';

export class SaleDetailResponseDto {
  id: number;
  saleId: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  taxRateId: string;
  taxPercentage: number;
  taxAmount: number;
  createdAt: Date;

  constructor(detail: SaleDetail) {
    this.id = detail.id;
    this.saleId = detail.saleId;
    this.productId = detail.productId;
    this.productName = detail.productName;
    this.productCode = detail.productCode;
    this.quantity = detail.quantity;
    this.unitPrice = detail.unitPrice;
    this.taxRateId = detail.taxRateId;
    this.taxPercentage = detail.taxPercentage;
    this.taxAmount = detail.taxAmount;
    this.createdAt = detail.createdAt;
  }

  static fromEntity(detail: SaleDetail): SaleDetailResponseDto {
    return new SaleDetailResponseDto(detail);
  }

  static fromEntities(details: SaleDetail[]): SaleDetailResponseDto[] {
    return details.map((d) => new SaleDetailResponseDto(d));
  }
}

