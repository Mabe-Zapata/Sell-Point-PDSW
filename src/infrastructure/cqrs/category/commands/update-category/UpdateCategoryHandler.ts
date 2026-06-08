import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateCategoryCommand } from '../../../../../application/cqrs/category/commands/update-category/update-category.command';
import { UpdateCategoryHandler as ApplicationUpdateCategoryHandler } from '../../../../../application/cqrs/category/commands/update-category/update-category.handler';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CATEGORY_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand> {
  private readonly appHandler: ApplicationUpdateCategoryHandler;

  constructor(
    @Inject(CATEGORY_REPOSITORY) categoryRepository: CategoryRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationUpdateCategoryHandler(categoryRepository);
  }

  async execute(command: UpdateCategoryCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'CATEGORIES',
      recordId: command.id,
      action: AuditAction.UPDATE,
      changedColumns: ['name'],
      newValues: { name: command.payload.name },
    });
    return result;
  }
}
