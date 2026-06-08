import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateCustomerCommand } from '../../../../../application/cqrs/customer/commands/update-customer/update-customer.command';
import { UpdateCustomerHandler as ApplicationUpdateCustomerHandler } from '../../../../../application/cqrs/customer/commands/update-customer/update-customer.handler';
import { CustomerRepository } from '../../../../repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerHandler implements ICommandHandler<UpdateCustomerCommand> {
  private readonly appHandler: ApplicationUpdateCustomerHandler;

  constructor(
    @Inject(CUSTOMER_REPOSITORY) customerRepository: CustomerRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationUpdateCustomerHandler(customerRepository);
  }

  async execute(command: UpdateCustomerCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'CUSTOMERS',
      recordId: command.id,
      action: AuditAction.UPDATE,
      changedColumns: Object.keys(command.payload),
      newValues: { ...command.payload },
    });
    return result;
  }
}
