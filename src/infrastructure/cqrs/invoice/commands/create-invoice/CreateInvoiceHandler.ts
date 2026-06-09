import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { CreateInvoiceCommand } from '../../../../../application/cqrs/invoice/commands/create-invoice/create-invoice.command';
import { CreateInvoiceHandler as ApplicationCreateInvoiceHandler } from '../../../../../application/cqrs/invoice/commands/create-invoice/create-invoice.handler';
import { InvoiceIssuedEvent } from '../../../../../domain/events/invoice-issued.event';
import type { ISaleDetailRepository } from '../../../../../domain/repositories';
import { InvoiceRepositoryImpl } from '../../../../persistence/typeorm/repositories/invoice.repository.impl';
import { InvoiceItemRepositoryImpl } from '../../../../persistence/typeorm/repositories/invoice-item.repository.impl';
import { InvoiceSeriesRepositoryImpl } from '../../../../persistence/typeorm/repositories/invoice-series.repository.impl';
import { SaleDetailRepositoryImpl } from '../../../../persistence/typeorm/repositories/sale-detail.repository.impl';
import { ProductRepositoryImpl } from '../../../../persistence/typeorm/repositories/product.repository.impl';
import { StockMovementRepositoryImpl } from '../../../../persistence/typeorm/repositories/stock-movement.repository.impl';

@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  private shouldPublishIssuedEvent(command: CreateInvoiceCommand): boolean {
    return Boolean(
      command.customerEmail
      && command.customerName
    );
  }

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateInvoiceCommand) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const appHandler = new ApplicationCreateInvoiceHandler(
        new InvoiceRepositoryImpl(queryRunner),
        new InvoiceItemRepositoryImpl(queryRunner),
        new InvoiceSeriesRepositoryImpl(queryRunner),
        new SaleDetailRepositoryImpl(queryRunner),
        new ProductRepositoryImpl(queryRunner),
        new StockMovementRepositoryImpl(queryRunner),
      );

      const result = await appHandler.execute(command);
      await queryRunner.commitTransaction();

      if (this.shouldPublishIssuedEvent(command)) {
        this.eventBus.publish(
          new InvoiceIssuedEvent(
            result.id,
            result.saleId,
            result.invoiceNumber,
            command.customerEmail!,
            command.customerName!,
            result.issueDate,
            result.total,
            result.subtotal,
            result.iva,
            result.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          ),
        );
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
