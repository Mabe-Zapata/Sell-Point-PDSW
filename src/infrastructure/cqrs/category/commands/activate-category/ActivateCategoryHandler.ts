import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateCategoryCommand } from '../../../../../application/cqrs/category/commands/activate-category/activate-category.command';
import { ActivateCategoryHandler as ApplicationActivateCategoryHandler } from '../../../../../application/cqrs/category/commands/activate-category/activate-category.handler';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CATEGORY_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(ActivateCategoryCommand)
export class ActivateCategoryHandler implements ICommandHandler<ActivateCategoryCommand> {
  private readonly appHandler: ApplicationActivateCategoryHandler;

  constructor(
    @Inject(CATEGORY_REPOSITORY) categoryRepository: CategoryRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationActivateCategoryHandler(categoryRepository);
  }

  async execute(command: ActivateCategoryCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'CATEGORIES',
      recordId: command.id,
      action: AuditAction.UPDATE,
      changedColumns: ['isActive'],
      newValues: { isActive: true },
    });
    return result;
  }
}
