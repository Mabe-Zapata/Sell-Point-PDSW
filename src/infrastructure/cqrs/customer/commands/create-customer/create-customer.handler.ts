import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateCustomerCommand } from '../../../../../application/cqrs/customer/commands/create-customer/create-customer.command';
import { CreateCustomerHandler as ApplicationCreateCustomerHandler } from '../../../../../application/cqrs/customer/commands/create-customer/create-customer.handler';
import { CustomerRepository } from '../../../../repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(CreateCustomerCommand)
export class CreateCustomerHandler implements ICommandHandler<CreateCustomerCommand> {
  private readonly appHandler: ApplicationCreateCustomerHandler;

  constructor(
    @Inject(CUSTOMER_REPOSITORY) customerRepository: CustomerRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationCreateCustomerHandler(customerRepository);
  }

  async execute(command: CreateCustomerCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'CUSTOMERS',
      recordId: result.id,
      action: AuditAction.INSERT,
      newValues: { ...command.payload },
    });
    return result;
  }
}
