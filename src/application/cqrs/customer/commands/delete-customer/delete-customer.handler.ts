import { DeleteCustomerCommand } from './delete-customer.command';
import type { ICustomerRepository } from '../../../../../domain/repositories';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

export class DeleteCustomerHandler {
  constructor(
    protected readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(command: DeleteCustomerCommand): Promise<void> {
    const id = command.id;
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new EntityNotFoundException('Customer', id);
    }

    // R9: CONSUMIDOR_FINAL delete protection
    if (customer.cedula === '9999999999999') {
      throw new BusinessRuleException('Cannot delete CONSUMIDOR_FINAL customer');
    }

    await this.customerRepository.softDelete(id);
  }
}
