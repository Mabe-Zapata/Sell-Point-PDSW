import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateCategoryCommand } from '../../../../../application/cqrs/category/commands/create-category/create-category.command';
import { CreateCategoryHandler as ApplicationCreateCategoryHandler } from '../../../../../application/cqrs/category/commands/create-category/create-category.handler';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { CATEGORY_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand> {
  private readonly appHandler: ApplicationCreateCategoryHandler;

  constructor(
    @Inject(CATEGORY_REPOSITORY) categoryRepository: CategoryRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationCreateCategoryHandler(categoryRepository);
  }

  async execute(command: CreateCategoryCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'CATEGORIES',
      recordId: result.id,
      action: AuditAction.INSERT,
      newValues: { name: command.payload.name },
    });
    return result;
  }
}
