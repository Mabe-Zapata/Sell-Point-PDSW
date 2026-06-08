import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateProductCommand } from '../../../../../application/cqrs/product/commands/create-product/create-product.command';
import { CreateProductHandler as ApplicationCreateProductHandler } from '../../../../../application/cqrs/product/commands/create-product/create-product.handler';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { ProductRepository } from '../../../../repositories/product.repository';
import { StockMovementRepository } from '../../../../repositories/stock-movement.repository';
import { CATEGORY_REPOSITORY, PRODUCT_REPOSITORY, STOCK_MOVEMENT_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  private readonly appHandler: ApplicationCreateProductHandler;

  constructor(
    @Inject(CATEGORY_REPOSITORY) categoryRepository: CategoryRepository,
    @Inject(PRODUCT_REPOSITORY) productRepository: ProductRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) stockMovementRepository: StockMovementRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationCreateProductHandler(categoryRepository, productRepository, stockMovementRepository);
  }

  async execute(command: CreateProductCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'PRODUCTS',
      recordId: result.id,
      action: AuditAction.INSERT,
      newValues: { ...command.payload },
    });
    return result;
  }
}
