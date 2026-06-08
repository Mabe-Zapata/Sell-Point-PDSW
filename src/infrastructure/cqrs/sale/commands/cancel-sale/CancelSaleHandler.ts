import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CancelSaleCommand } from '../../../../../application/cqrs/sale/commands/cancel-sale/cancel-sale.command';
import { CancelSaleUseCase } from '../../../../../application/use-cases/sale/cancel-sale.use-case';
import { TypeOrmUnitOfWork } from '../../../../persistence/typeorm/unit-of-work/typeorm-unit-of-work';
import { UNIT_OF_WORK } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(CancelSaleCommand)
export class CancelSaleHandler implements ICommandHandler<CancelSaleCommand> {
  private readonly useCase: CancelSaleUseCase;

  constructor(
    @Inject(UNIT_OF_WORK) uow: TypeOrmUnitOfWork,
    private readonly auditService: AuditService,
  ) {
    this.useCase = new CancelSaleUseCase(uow);
  }

  async execute(command: CancelSaleCommand) {
    const result = await this.useCase.execute(command.saleId);
    this.auditService.audit({
      tableName: 'SALES',
      recordId: command.saleId,
      action: AuditAction.UPDATE,
      changedColumns: ['status'],
      newValues: { status: 'CANCELLED' },
    });
    return result;
  }
}
