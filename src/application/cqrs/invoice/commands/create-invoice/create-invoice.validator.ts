import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from '../../../../dto/invoice/create-invoice.dto';

export interface ValidatedInvoiceItems {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface ValidatedCreateInvoice {
  customerId: string;
  items: ValidatedInvoiceItems[];
}

@Injectable()
export class CreateInvoiceValidator {
  validate(payload: CreateInvoiceDto): ValidatedCreateInvoice {
    if (!payload.customerId || payload.customerId.trim().length === 0) {
      throw new BadRequestException('Customer id is required');
    }
    if (!payload.items || payload.items.length === 0) {
      throw new BadRequestException('Invoice must have at least one item');
    }
    for (const item of payload.items) {
      if (!item.productId || item.productId.trim().length === 0) {
        throw new BadRequestException('Product id is required in each item');
      }
      if (item.quantity <= 0) {
        throw new BadRequestException('Item quantity must be greater than zero');
      }
    }
    return {
      customerId: payload.customerId,
      items: payload.items,
    };
  }
}
