import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CancelInvoiceCommand } from '../../../../../application/cqrs/invoice/commands/cancel-invoice/cancel-invoice.command';
import { CancelInvoiceHandler as ApplicationCancelInvoiceHandler } from '../../../../../application/cqrs/invoice/commands/cancel-invoice/cancel-invoice.handler';
import { InvoiceRepository } from '../../../../repositories/invoice.repository';
import { INVOICE_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(CancelInvoiceCommand)
export class CancelInvoiceHandler implements ICommandHandler<CancelInvoiceCommand> {
  private readonly appHandler: ApplicationCancelInvoiceHandler;

  constructor(
    @Inject(INVOICE_REPOSITORY) invoiceRepository: InvoiceRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationCancelInvoiceHandler(invoiceRepository);
  }

  async execute(command: CancelInvoiceCommand): Promise<void> {
    await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'INVOICES',
      recordId: command.invoiceId,
      action: AuditAction.UPDATE,
      changedColumns: ['status'],
      newValues: { status: 'CANCELLED' },
      
    });
  }
}
