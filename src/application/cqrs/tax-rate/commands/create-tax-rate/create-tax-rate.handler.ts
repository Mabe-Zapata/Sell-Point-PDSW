import { randomUUID } from 'crypto';
import { CreateTaxRateCommand } from './create-tax-rate.command';
import type { ITaxRateRepository } from '../../../../../domain/repositories';
import { TaxRate } from '../../../../../domain/entities';

export class CreateTaxRateHandler {
  constructor(
    protected readonly taxRateRepository: ITaxRateRepository,
  ) {}

  async execute(command: CreateTaxRateCommand): Promise<TaxRate> {
    const existing = await this.taxRateRepository.findByName(command.payload.name);
    if (existing) {
      throw new Error(`Tax rate with name '${command.payload.name}' already exists`);
    }

    // TODO: inject IUuidGenerator once ports are wired.
    const taxRate = new TaxRate({
      id: randomUUID(),
      name: command.payload.name,
      percentage: command.payload.percentage,
      isActive: command.payload.isActive ?? true,
    });

    return this.taxRateRepository.create(taxRate);
  }
}
