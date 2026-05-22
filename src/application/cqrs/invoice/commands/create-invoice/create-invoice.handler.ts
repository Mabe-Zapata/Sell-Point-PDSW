import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { CreateInvoiceCommand } from './create-invoice.command';
import { CreateInvoiceValidator } from './create-invoice.validator';
import { InvoiceRepository } from '../../../../../infrastructure/repositories/invoice.repository';
import { InvoiceItemRepository } from '../../../../../infrastructure/repositories/invoice-item.repository';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { TaxCalculator } from '../../../../../domain/services/tax-calculator.service';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Invoice } from '../../../../../domain/entities/invoice.entity';
import { InvoiceItem } from '../../../../../domain/entities/invoice-item.entity';
import { Product } from '../../../../../domain/entities/product.entity';
import { InvoiceStatus } from '../../../../../domain/entities/enums/invoice-status.enum';

@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  constructor(
    private readonly validator: CreateInvoiceValidator,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly invoiceItemRepository: InvoiceItemRepository,
    private readonly productRepository: ProductRepository,
    private readonly taxCalculator: TaxCalculator,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<Invoice> {
    const validated = this.validator.validate(command.payload);

    const productMap = new Map<string, Product>();
    for (const item of validated.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new EntityNotFoundException('Product', item.productId);
      }
      if (product.isActive === false) {
        throw new BadRequestException(`Product ${product.name} is not active`);
      }
      productMap.set(item.productId, product);
    }

    const invoiceDate = new Date();
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoiceItems: InvoiceItem[] = validated.items.map((itemDto) => {
      const product = productMap.get(itemDto.productId)!;
      return new InvoiceItem({
        productId: itemDto.productId,
        quantity: itemDto.quantity,
        unitPrice: product.salePrice,
      });
    });

    const { subtotal, iva, total } =
      this.taxCalculator.calculateAll(invoiceItems);

    const invoice = new Invoice({
      saleId: validated.saleId,
      seriesId: validated.seriesId,
      invoiceNumber,
      issueDate: invoiceDate,
      status: InvoiceStatus.ISSUED,
    });

    const savedInvoice = await this.invoiceRepository.create(invoice);

    invoiceItems.forEach((item) => {
      item.invoiceId = savedInvoice.id;
    });

    await this.invoiceItemRepository.createMany(invoiceItems);

    const completeInvoice = await this.invoiceRepository.findById(
      savedInvoice.id,
    );
    if (!completeInvoice) {
      throw new Error('Failed to retrieve created invoice');
    }

    return completeInvoice;
  }

  private async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');

    const total = await this.invoiceRepository.countByInvoiceNumberPrefix(
      `INV-${datePrefix}`
    );

    const sequenceNumber = total + 1;
    const paddedNumber = sequenceNumber.toString().padStart(5, '0');

    return `INV-${datePrefix}-${paddedNumber}`;
  }
}
