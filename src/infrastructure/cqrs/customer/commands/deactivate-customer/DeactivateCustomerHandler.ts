import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeactivateCustomerCommand } from '../../../../../application/cqrs/customer/commands/deactivate-customer/deactivate-customer.command';
import { DeactivateCustomerHandler as ApplicationDeactivateCustomerHandler } from '../../../../../application/cqrs/customer/commands/deactivate-customer/deactivate-customer.handler';
import { CustomerRepository } from '../../../../repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(DeactivateCustomerCommand)
export class DeactivateCustomerHandler implements ICommandHandler<DeactivateCustomerCommand> {
  private readonly appHandler: ApplicationDeactivateCustomerHandler;

  constructor(
    @Inject(CUSTOMER_REPOSITORY) customerRepository: CustomerRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationDeactivateCustomerHandler(customerRepository);
  }

  async execute(command: DeactivateCustomerCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'CUSTOMERS',
      recordId: command.id,
      action: AuditAction.DELETE,
      metadata: { reason: 'soft-delete' },
    });
    return result;
  }
}
