const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'application', 'cqrs');

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content.trim());
}

// ---------------- INVOICE ----------------

const invDir = path.join(baseDir, 'invoice');

// CreateInvoice
writeFile(path.join(invDir, 'commands', 'create-invoice', 'create-invoice.command.ts'), `
import { CreateInvoiceDto } from '../../../../dto/invoice/create-invoice.dto';

export class CreateInvoiceCommand {
  constructor(public readonly payload: CreateInvoiceDto) {}
}
`);

writeFile(path.join(invDir, 'commands', 'create-invoice', 'create-invoice.validator.ts'), `
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
`);

writeFile(path.join(invDir, 'commands', 'create-invoice', 'create-invoice.handler.ts'), `
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { CreateInvoiceCommand } from './create-invoice.command';
import { CreateInvoiceValidator } from './create-invoice.validator';
import { InvoiceRepository } from '../../../../../infrastructure/repositories/invoice.repository';
import { InvoiceItemRepository } from '../../../../../infrastructure/repositories/invoice-item.repository';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { TaxCalculator } from '../../../../../domain/services/tax-calculator.service';
import { Invoice } from '../../../../../domain/entities/invoice.entity';
import { InvoiceItem } from '../../../../../domain/entities/invoice-item.entity';

@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  constructor(
    private readonly validator: CreateInvoiceValidator,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly invoiceItemRepository: InvoiceItemRepository,
    private readonly productRepository: ProductRepository,
    private readonly taxCalculator: TaxCalculator,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<Invoice> {
    // Validamos cliente y productos (existencia y stock) antes de iniciar la transacción central
    const { customer, productMap } = await this.validator.validate(command.payload);
    
    // Server-generated invoice date
    const invoiceDate = new Date();
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoiceItems: InvoiceItem[] = command.payload.items.map((itemDto) => {
      const product = productMap.get(itemDto.productId)!;
      return new InvoiceItem({
        productId: itemDto.productId,
        quantity: itemDto.quantity,
        unitPrice: product.unitPrice, 
      });
    });

    const { subtotal, iva, total } = this.taxCalculator.calculateAll(invoiceItems);

    const invoice = new Invoice({
      invoiceNumber,
      invoiceDate,
      customerId: customer.id,
      subtotal,
      iva,
      total,
    });

    // Save invoice first to get the ID
    const savedInvoice = await this.invoiceRepository.create(invoice);

    // Update invoice items with the invoice ID
    invoiceItems.forEach((item) => {
      item.invoiceId = savedInvoice.id;
    });

    // Save invoice items
    await this.invoiceItemRepository.createMany(invoiceItems);

    // Decrement stock for each product
    for (const itemDto of command.payload.items) {
      await this.productRepository.decrementStock(itemDto.productId, itemDto.quantity);
    }

    const completeInvoice = await this.invoiceRepository.findById(savedInvoice.id);
    if (!completeInvoice) {
      throw new Error('Failed to retrieve created invoice');
    }

    return completeInvoice;
  }

  private async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const result = await this.invoiceRepository.findAll(
      { page: 1, limit: 1000 },
      { invoiceNumber: \`INV-\${datePrefix}\` },
    );
    
    const sequenceNumber = result.total + 1;
    const paddedNumber = sequenceNumber.toString().padStart(5, '0');
    
    return \`INV-\${datePrefix}-\${paddedNumber}\`;
  }
}
`);

// GetInvoice
writeFile(path.join(invDir, 'queries', 'get-invoice', 'get-invoice.query.ts'), `
export class GetInvoiceQuery {
  constructor(public readonly id: string) {}
}
`);

writeFile(path.join(invDir, 'queries', 'get-invoice', 'get-invoice.validator.ts'), `
import { Injectable } from '@nestjs/common';
import { InvoiceRepository } from '../../../../../infrastructure/repositories/invoice.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Invoice } from '../../../../../domain/entities/invoice.entity';

@Injectable()
export class GetInvoiceValidator {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async validate(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new EntityNotFoundException('Invoice', id);
    }
    return invoice;
  }
}
`);

writeFile(path.join(invDir, 'queries', 'get-invoice', 'get-invoice.handler.ts'), `
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetInvoiceQuery } from './get-invoice.query';
import { GetInvoiceValidator } from './get-invoice.validator';
import { Invoice } from '../../../../../domain/entities/invoice.entity';

@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler implements IQueryHandler<GetInvoiceQuery> {
  constructor(private readonly validator: GetInvoiceValidator) {}

  async execute(query: GetInvoiceQuery): Promise<Invoice> {
    return this.validator.validate(query.id);
  }
}
`);

// ListInvoices
writeFile(path.join(invDir, 'queries', 'list-invoices', 'list-invoices.query.ts'), `
import { InvoiceFilters, PaginatedResult } from '../../../../../domain/repositories/invoice.repository.interface';
import { PaginationParams } from '../../../../../domain/repositories/customer.repository.interface';

export class ListInvoicesQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly filters: InvoiceFilters = {},
  ) {}
}
`);

writeFile(path.join(invDir, 'queries', 'list-invoices', 'list-invoices.validator.ts'), `
import { Injectable } from '@nestjs/common';
import { PaginationParams } from '../../../../../domain/repositories/customer.repository.interface';

@Injectable()
export class ListInvoicesValidator {
  validate(pagination: PaginationParams): PaginationParams {
    const page = pagination.page > 0 ? pagination.page : 1;
    const limit = pagination.limit > 0 ? pagination.limit : 20;
    return { page, limit };
  }
}
`);

writeFile(path.join(invDir, 'queries', 'list-invoices', 'list-invoices.handler.ts'), `
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListInvoicesQuery } from './list-invoices.query';
import { ListInvoicesValidator } from './list-invoices.validator';
import { InvoiceRepository } from '../../../../../infrastructure/repositories/invoice.repository';
import { PaginatedResult } from '../../../../../domain/repositories/invoice.repository.interface';
import { Invoice } from '../../../../../domain/entities/invoice.entity';

@QueryHandler(ListInvoicesQuery)
export class ListInvoicesHandler implements IQueryHandler<ListInvoicesQuery> {
  constructor(
    private readonly validator: ListInvoicesValidator,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(query: ListInvoicesQuery): Promise<PaginatedResult<Invoice>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.invoiceRepository.findAll(validPagination, query.filters);
  }
}
`);

// GenerateInvoicePdf
writeFile(path.join(invDir, 'queries', 'generate-invoice-pdf', 'generate-invoice-pdf.query.ts'), `
export class GenerateInvoicePdfQuery {
  constructor(public readonly id: string) {}
}
`);

writeFile(path.join(invDir, 'queries', 'generate-invoice-pdf', 'generate-invoice-pdf.validator.ts'), `
import { Injectable } from '@nestjs/common';
import { InvoiceRepository } from '../../../../../infrastructure/repositories/invoice.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Invoice } from '../../../../../domain/entities/invoice.entity';

@Injectable()
export class GenerateInvoicePdfValidator {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async validate(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new EntityNotFoundException('Invoice', id);
    }
    return invoice;
  }
}
`);

writeFile(path.join(invDir, 'queries', 'generate-invoice-pdf', 'generate-invoice-pdf.handler.ts'), `
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GenerateInvoicePdfQuery } from './generate-invoice-pdf.query';
import { GenerateInvoicePdfValidator } from './generate-invoice-pdf.validator';
import { InvoiceItemRepository } from '../../../../../infrastructure/repositories/invoice-item.repository';
import { PdfService } from '../../../../../infrastructure/services/pdf.service';

@QueryHandler(GenerateInvoicePdfQuery)
export class GenerateInvoicePdfHandler implements IQueryHandler<GenerateInvoicePdfQuery> {
  constructor(
    private readonly validator: GenerateInvoicePdfValidator,
    private readonly invoiceItemRepository: InvoiceItemRepository,
    private readonly pdfService: PdfService,
  ) {}

  async execute(query: GenerateInvoicePdfQuery): Promise<Buffer> {
    const invoice = await this.validator.validate(query.id);
    const items = await this.invoiceItemRepository.findByInvoiceId(query.id);
    
    return this.pdfService.generateInvoicePdf(invoice, items);
  }
}
`);

console.log('Invoice script finish');
