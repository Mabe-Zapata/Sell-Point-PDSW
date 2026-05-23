import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteCustomerCommand } from './delete-customer.command';
import { DeleteCustomerValidator } from './delete-customer.validator';
import { CUSTOMER_REPOSITORY } from '../../../../tokens';
import type { ICustomerRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

@CommandHandler(DeleteCustomerCommand)
export class DeleteCustomerHandler implements ICommandHandler<DeleteCustomerCommand> {
  constructor(
    private readonly validator: DeleteCustomerValidator,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(command: DeleteCustomerCommand): Promise<void> {
    const id = this.validator.validate(command.id);
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new EntityNotFoundException('Customer', id);
    }

    // R9: CONSUMIDOR_FINAL delete protection
    if (customer.identificationNumber === '9999999999999') {
      throw new BusinessRuleException('Cannot delete CONSUMIDOR_FINAL customer');
    }

    await this.customerRepository.softDelete(id);
  }
}
