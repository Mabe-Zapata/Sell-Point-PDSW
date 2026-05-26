import { UpdateTaxRateCommand } from './update-tax-rate.command';
import type { ITaxRateRepository } from '../../../../../domain/repositories';
import { TaxRate } from '../../../../../domain/entities';

export class UpdateTaxRateHandler {
  constructor(
    protected readonly taxRateRepository: ITaxRateRepository,
  ) {}

  async execute(command: UpdateTaxRateCommand): Promise<TaxRate> {
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
      id: existing.id,
      name: command.payload.name ?? existing.name,
      percentage: command.payload.percentage ?? existing.percentage,
      isActive: command.payload.isActive ?? existing.isActive,
      createdAt: existing.createdAt,
    });

    return this.taxRateRepository.update(updated);
  }
}
