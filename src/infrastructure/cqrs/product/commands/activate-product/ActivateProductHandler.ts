import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateProductCommand } from '../../../../../application/cqrs/product/commands/activate-product/activate-product.command';
import { ActivateProductHandler as ApplicationActivateProductHandler } from '../../../../../application/cqrs/product/commands/activate-product/activate-product.handler';
import { ProductRepository } from '../../../../repositories/product.repository';
import { PRODUCT_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(ActivateProductCommand)
export class ActivateProductHandler implements ICommandHandler<ActivateProductCommand> {
  private readonly appHandler: ApplicationActivateProductHandler;

  constructor(
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationActivateProductHandler(productRepository);
  }

  async execute(command: ActivateProductCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'PRODUCTS',
      recordId: command.id,
      action: AuditAction.UPDATE,
      changedColumns: ['isActive'],
      newValues: { isActive: true },
    });
    return result;
  }
}
