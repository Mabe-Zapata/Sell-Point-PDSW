import { ApiProperty } from '@nestjs/swagger';
import { Sale } from '../../../domain/entities/sale.entity';
import { SaleDetail } from '../../../domain/entities/sale-detail.entity';
import { SaleDetailResponseDto } from './sale-detail-response.dto';

export class SaleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  branchId: string;

  @ApiProperty()
  customerId: string | null;

  @ApiProperty()
  cashierUserId: string;

  @ApiProperty()
  saleNumber: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ type: [SaleDetailResponseDto] })
  details?: SaleDetailResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(sale: Sale, details?: SaleDetail[]) {
    this.id = sale.id;
    this.branchId = sale.branchId;
    this.customerId = sale.customerId;
    this.cashierUserId = sale.cashierUserId;
    this.saleNumber = sale.saleNumber;
    this.status = sale.status;
    this.subtotal = sale.subtotal;
    this.taxAmount = sale.taxAmount;
    this.discountAmount = sale.discountAmount;
    this.total = sale.total;
    this.details = details ? SaleDetailResponseDto.fromEntities(details) : undefined;
    this.createdAt = sale.createdAt;
    this.updatedAt = sale.updatedAt;
  }

  static fromEntity(sale: Sale, details?: SaleDetail[]): SaleResponseDto {
    return new SaleResponseDto(sale, details);
  }

  static fromEntities(sales: Sale[]): SaleResponseDto[] {
    return sales.map((sale) => new SaleResponseDto(sale));
  }
}