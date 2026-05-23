import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateTaxRateCommand } from './update-tax-rate.command';
import { UpdateTaxRateValidator } from './update-tax-rate.validator';
import { TAX_RATE_REPOSITORY } from '../../../../tokens';
import type { ITaxRateRepository } from '../../../../../domain/repositories';
import { TaxRate } from '../../../../../domain/entities';

@CommandHandler(UpdateTaxRateCommand)
export class UpdateTaxRateHandler implements ICommandHandler<UpdateTaxRateCommand> {
  constructor(
    private readonly validator: UpdateTaxRateValidator,
    @Inject(TAX_RATE_REPOSITORY) private readonly taxRateRepository: ITaxRateRepository,
  ) {}

  async execute(command: UpdateTaxRateCommand): Promise<TaxRate> {
    this.validator.validate(command.id, command.payload);

    const existing = await this.taxRateRepository.findById(command.id);
    if (!existing) {
      throw new Error(`Tax rate with ID '${command.id}' not found`);
    }

    if (command.payload.name && command.payload.name !== existing.name) {
      const nameConflict = await this.taxRateRepository.findByName(command.payload.name);
      if (nameConflict && nameConflict.id !== command.id) {
        throw new Error(`Tax rate with name '${command.payload.name}' already exists`);
      }
    }

    const updated = new TaxRate({
      ...existing,
      ...command.payload,
    });

    return this.taxRateRepository.update(updated);
  }
}