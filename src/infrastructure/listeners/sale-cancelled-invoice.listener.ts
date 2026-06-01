import { Inject, Optional } from '@nestjs/common';
import type { IErrorLogRepository } from '../../domain/repositories';
import { ERROR_LOG_REPOSITORY } from '../common/injection-tokens';
import { ErrorLog } from '../../domain/entities';
import { ExceptionType } from '../../domain/entities/enums';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CancelInvoiceCommand } from '../../application/cqrs/invoice/commands/cancel-invoice/cancel-invoice.command';
import { InvoiceStatus } from '../../domain/entities';
import { SaleCancelledEvent } from '../../domain/events/sale-cancelled.event';
import { INVOICE_REPOSITORY } from '../common/injection-tokens';
import { InvoiceRepository } from '../repositories/invoice.repository';

@EventsHandler(SaleCancelledEvent)
export class SaleCancelledInvoiceListener implements IEventHandler<SaleCancelledEvent> {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(INVOICE_REPOSITORY) private readonly invoiceRepository: InvoiceRepository,
    @Optional()
    @Inject(ERROR_LOG_REPOSITORY)
    private readonly errorLogRepository?: IErrorLogRepository,
  ) {}

  async handle(event: SaleCancelledEvent): Promise<void> {
    try {
      const invoice = await this.invoiceRepository.findBySaleId(event.saleId);
      if (!invoice || invoice.status === InvoiceStatus.CANCELLED) {
        return;
      }

      await this.commandBus.execute(new CancelInvoiceCommand(invoice.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;
      console.error(
        `[SaleCancelledInvoiceListener] Failed to cancel invoice for sale ${event.saleId}:`,
        error,
      );
      if (this.errorLogRepository) {
        const errorLog = new ErrorLog({
          exceptionType: ExceptionType.EXTERNAL_SERVICE_ERROR,
          message,
          stackTrace,
          source: 'SaleCancelledInvoiceListener',
        });
        this.errorLogRepository.create(errorLog).catch(() => undefined);
      }
    }
  }
}
