import { ApiProperty } from '@nestjs/swagger';
import { SaleDetail } from '../../../domain/entities/sale-detail.entity';

export class SaleDetailResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  saleId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  productCode: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  createdAt: Date;

  constructor(detail: SaleDetail) {
    this.id = detail.id;
    this.saleId = detail.saleId;
    this.productId = detail.productId;
    this.productName = detail.productName;
    this.productCode = detail.productCode;
    this.quantity = detail.quantity;
    this.unitPrice = detail.unitPrice;
    this.createdAt = detail.createdAt;
  }

  static fromEntity(detail: SaleDetail): SaleDetailResponseDto {
    return new SaleDetailResponseDto(detail);
  }

  static fromEntities(details: SaleDetail[]): SaleDetailResponseDto[] {
    return details.map((d) => new SaleDetailResponseDto(d));
  }
}
