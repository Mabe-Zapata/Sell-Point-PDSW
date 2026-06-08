import { InvoiceItem } from '../../../domain/entities';

export class InvoiceItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRateId?: string;
  taxPercentage: number;
  taxAmount: number;
  total: number;

  constructor(item: InvoiceItem) {
    this.id = item.id;
    this.productId = item.productId;
    this.productName = item.productName;
    this.quantity = item.quantity;
    this.unitPrice = item.unitPrice;
    this.subtotal = item.subtotal;
    this.taxRateId = item.taxRateId;
    this.taxPercentage = item.taxPercentage ?? 0;
    this.taxAmount = item.taxAmount ?? 0;
    this.total = item.total;
  }

  static fromEntity(item: InvoiceItem): InvoiceItemResponseDto {
    return new InvoiceItemResponseDto(item);
  }

  static fromEntities(items: InvoiceItem[]): InvoiceItemResponseDto[] {
    return items.map(InvoiceItemResponseDto.fromEntity);
  }
}
