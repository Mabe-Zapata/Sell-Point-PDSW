import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeactivateCategoryCommand } from '../../../../../application/cqrs/category/commands/deactivate-category/deactivate-category.command';
import { DeactivateCategoryHandler as ApplicationDeactivateCategoryHandler } from '../../../../../application/cqrs/category/commands/deactivate-category/deactivate-category.handler';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CATEGORY_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(DeactivateCategoryCommand)
export class DeactivateCategoryHandler implements ICommandHandler<DeactivateCategoryCommand> {
  private readonly appHandler: ApplicationDeactivateCategoryHandler;

  constructor(
    @Inject(CATEGORY_REPOSITORY) categoryRepository: CategoryRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationDeactivateCategoryHandler(categoryRepository);
  }

  async execute(command: DeactivateCategoryCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'CATEGORIES',
      recordId: command.id,
      action: AuditAction.DELETE,
      metadata: { reason: 'soft-delete' },
    });
    return result;
  }
}
