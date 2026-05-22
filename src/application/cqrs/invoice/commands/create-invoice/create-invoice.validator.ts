import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateInvoiceDto } from '../../../../dto/invoice/create-invoice.dto';

export interface ValidatedInvoiceItems {
  productId: string;
  quantity: number;
}

export interface ValidatedCreateInvoice {
  saleId: string;
  seriesId: string;
  items: ValidatedInvoiceItems[];
}

@Injectable()
export class CreateInvoiceValidator {
  validate(payload: CreateInvoiceDto): ValidatedCreateInvoice {
    if (!payload.saleId || payload.saleId.trim().length === 0) {
      throw new BadRequestException('Sale id is required');
    }
    if (!payload.seriesId || payload.seriesId.trim().length === 0) {
      throw new BadRequestException('Series id is required');
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
      saleId: payload.saleId,
      seriesId: payload.seriesId,
      items: payload.items,
    };
  }
}
