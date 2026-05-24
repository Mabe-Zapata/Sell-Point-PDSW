import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateTaxRateCommand } from './create-tax-rate.command';
import { CreateTaxRateValidator } from './create-tax-rate.validator';
import { TAX_RATE_REPOSITORY } from '../../../../tokens';
import type { ITaxRateRepository } from '../../../../../domain/repositories';
import { TaxRate } from '../../../../../domain/entities';

@CommandHandler(CreateTaxRateCommand)
export class CreateTaxRateHandler implements ICommandHandler<CreateTaxRateCommand> {
  constructor(
    private readonly validator: CreateTaxRateValidator,
    @Inject(TAX_RATE_REPOSITORY) private readonly taxRateRepository: ITaxRateRepository,
  ) {}

  async execute(command: CreateTaxRateCommand): Promise<TaxRate> {
    this.validator.validate(command.payload);

    const existing = await this.taxRateRepository.findByName(command.payload.name);
    if (existing) {
      throw new Error(`Tax rate with name '${command.payload.name}' already exists`);
    }

    const taxRate = new TaxRate({
      id: randomUUID(),
      name: command.payload.name,
      percentage: command.payload.percentage,
      isActive: command.payload.isActive ?? true,
    });

    return this.taxRateRepository.create(taxRate);
  }
}