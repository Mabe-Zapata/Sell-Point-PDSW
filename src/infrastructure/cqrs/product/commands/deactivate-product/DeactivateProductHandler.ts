import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeactivateProductCommand } from '../../../../../application/cqrs/product/commands/deactivate-product/deactivate-product.command';
import { DeactivateProductHandler as ApplicationDeactivateProductHandler } from '../../../../../application/cqrs/product/commands/deactivate-product/deactivate-product.handler';
import { ProductRepository } from '../../../../repositories/product.repository';
import { PRODUCT_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(DeactivateProductCommand)
export class DeactivateProductHandler implements ICommandHandler<DeactivateProductCommand> {
  private readonly appHandler: ApplicationDeactivateProductHandler;

  constructor(
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationDeactivateProductHandler(productRepository);
  }

  async execute(command: DeactivateProductCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'PRODUCTS',
      recordId: command.id,
      action: AuditAction.DELETE,
      metadata: { reason: 'soft-delete' },
    });
    return result;
  }
}
