import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateProductCommand } from '../../../../../application/cqrs/product/commands/update-product/update-product.command';
import { UpdateProductHandler as ApplicationUpdateProductHandler } from '../../../../../application/cqrs/product/commands/update-product/update-product.handler';
import { ProductRepository } from '../../../../repositories/product.repository';
import { PRODUCT_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  private readonly appHandler: ApplicationUpdateProductHandler;

  constructor(
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationUpdateProductHandler(productRepository);
  }

  async execute(command: UpdateProductCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'PRODUCTS',
      recordId: command.id,
      action: AuditAction.UPDATE,
      changedColumns: Object.keys(command.payload),
      newValues: { ...command.payload },
    });
    return result;
  }
}
