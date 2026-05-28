import { Sale } from '../../../domain/entities/sale.entity';
import { SaleDetail } from '../../../domain/entities/sale-detail.entity';
import { SaleDetailResponseDto } from './sale-detail-response.dto';

export class SaleResponseDto {
  id: string;
  branchId: string;
  customerId: string | null;
  cashierUserId: string;
  saleNumber: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  details?: SaleDetailResponseDto[];
  createdAt: Date;
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
