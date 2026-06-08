import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateTaxRateCommand } from '../../../../../application/cqrs/tax-rate/commands/update-tax-rate/update-tax-rate.command';
import { UpdateTaxRateHandler as ApplicationUpdateTaxRateHandler } from '../../../../../application/cqrs/tax-rate/commands/update-tax-rate/update-tax-rate.handler';
import { TaxRateRepository } from '../../../../repositories/tax-rate.repository';
import { TAX_RATE_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(UpdateTaxRateCommand)
export class UpdateTaxRateHandler implements ICommandHandler<UpdateTaxRateCommand> {
  private readonly appHandler: ApplicationUpdateTaxRateHandler;

  constructor(
    @Inject(TAX_RATE_REPOSITORY) taxRateRepository: TaxRateRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationUpdateTaxRateHandler(taxRateRepository);
  }

  async execute(command: UpdateTaxRateCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'TAX_RATES',
      recordId: command.id,
      action: AuditAction.UPDATE,
      changedColumns: Object.keys(command.payload),
      newValues: { ...command.payload },
    });
    return result;
  }
}
