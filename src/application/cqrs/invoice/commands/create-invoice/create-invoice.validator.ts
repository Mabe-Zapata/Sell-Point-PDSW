import { Injectable } from '@nestjs/common';
import { CustomerRepository } from '../../../../../infrastructure/repositories/customer.repository';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { InsufficientStockException } from '../../../../../domain/exceptions/insufficient-stock.exception';
import { CreateInvoiceDto } from '../../../../dto/invoice/create-invoice.dto';
import { Product } from '../../../../../domain/entities/product.entity';
import { Customer } from '../../../../../domain/entities/customer.entity';

export interface ValidatedInvoicePayload {
  customer: Customer;
  productMap: Map<string, Product>;
}

@Injectable()
export class CreateInvoiceValidator {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async validate(payload: CreateInvoiceDto): Promise<ValidatedInvoicePayload> {
    const customer = await this.customerRepository.findById(payload.customerId);
    if (!customer) {
      throw new EntityNotFoundException('Customer', payload.customerId);
    }

    const productMap = new Map<string, Product>();
    for (const itemDto of payload.items) {
      const product = await this.productRepository.findById(itemDto.productId);
      if (!product) {
        throw new EntityNotFoundException('Product', itemDto.productId);
      }
      productMap.set(itemDto.productId, product);

      if (product.availableQuantity < itemDto.quantity) {
        throw new InsufficientStockException(
          product.name,
          itemDto.quantity,
          product.availableQuantity,
        );
      }
    }

    return { customer, productMap };
  }
}
