import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateTaxRateCommand } from '../../../../../application/cqrs/tax-rate/commands/update-tax-rate/update-tax-rate.command';
import { UpdateTaxRateHandler as ApplicationUpdateTaxRateHandler } from '../../../../../application/cqrs/tax-rate/commands/update-tax-rate/update-tax-rate.handler';
import { TaxRateRepository } from '../../../../repositories/tax-rate.repository';
import { TAX_RATE_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(UpdateTaxRateCommand)
export class UpdateTaxRateHandler implements ICommandHandler<UpdateTaxRateCommand> {
  private readonly appHandler: ApplicationUpdateTaxRateHandler;

  constructor(
    @Inject(TAX_RATE_REPOSITORY) taxRateRepository: TaxRateRepository,
  ) {
    this.appHandler = new ApplicationUpdateTaxRateHandler(taxRateRepository);
  }

  async execute(command: UpdateTaxRateCommand) {
    return this.appHandler.execute(command);
  }
}