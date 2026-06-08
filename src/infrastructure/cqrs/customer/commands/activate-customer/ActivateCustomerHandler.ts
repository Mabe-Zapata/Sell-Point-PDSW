import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateCustomerCommand } from '../../../../../application/cqrs/customer/commands/activate-customer/activate-customer.command';
import { ActivateCustomerHandler as ApplicationActivateCustomerHandler } from '../../../../../application/cqrs/customer/commands/activate-customer/activate-customer.handler';
import { CustomerRepository } from '../../../../repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(ActivateCustomerCommand)
export class ActivateCustomerHandler implements ICommandHandler<ActivateCustomerCommand> {
  private readonly appHandler: ApplicationActivateCustomerHandler;

  constructor(
    @Inject(CUSTOMER_REPOSITORY) customerRepository: CustomerRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationActivateCustomerHandler(customerRepository);
  }

  async execute(command: ActivateCustomerCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'CUSTOMERS',
      recordId: command.id,
      action: AuditAction.UPDATE,
      changedColumns: ['isActive'],
      newValues: { isActive: true },
    });
    return result;
  }
}
