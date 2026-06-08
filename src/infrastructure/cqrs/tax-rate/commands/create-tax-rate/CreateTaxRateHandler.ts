import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateTaxRateCommand } from '../../../../../application/cqrs/tax-rate/commands/create-tax-rate/create-tax-rate.command';
import { CreateTaxRateHandler as ApplicationCreateTaxRateHandler } from '../../../../../application/cqrs/tax-rate/commands/create-tax-rate/create-tax-rate.handler';
import { TaxRateRepository } from '../../../../repositories/tax-rate.repository';
import { TAX_RATE_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(CreateTaxRateCommand)
export class CreateTaxRateHandler implements ICommandHandler<CreateTaxRateCommand> {
  private readonly appHandler: ApplicationCreateTaxRateHandler;

  constructor(
    @Inject(TAX_RATE_REPOSITORY) taxRateRepository: TaxRateRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationCreateTaxRateHandler(taxRateRepository);
  }

  async execute(command: CreateTaxRateCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'TAX_RATES',
      recordId: result.id,
      action: AuditAction.INSERT,
      newValues: { ...command.payload },
    });
    return result;
  }
}
