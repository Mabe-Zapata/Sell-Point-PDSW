import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateTaxRateCommand } from '../../../../../application/cqrs/tax-rate/commands/create-tax-rate/create-tax-rate.command';
import { CreateTaxRateHandler as ApplicationCreateTaxRateHandler } from '../../../../../application/cqrs/tax-rate/commands/create-tax-rate/create-tax-rate.handler';
import { TaxRateRepository } from '../../../../repositories/tax-rate.repository';
import { TAX_RATE_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(CreateTaxRateCommand)
export class CreateTaxRateHandler implements ICommandHandler<CreateTaxRateCommand> {
  private readonly appHandler: ApplicationCreateTaxRateHandler;

  constructor(
    @Inject(TAX_RATE_REPOSITORY) taxRateRepository: TaxRateRepository,
  ) {
    this.appHandler = new ApplicationCreateTaxRateHandler(taxRateRepository);
  }

  async execute(command: CreateTaxRateCommand) {
    return this.appHandler.execute(command);
  }
}