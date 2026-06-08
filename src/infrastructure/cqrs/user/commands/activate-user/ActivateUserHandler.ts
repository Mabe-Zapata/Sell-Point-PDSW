import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateUserCommand } from '../../../../../application/cqrs/user/commands/activate-user/activate-user.command';
import { ActivateUserHandler as ApplicationActivateUserHandler } from '../../../../../application/cqrs/user/commands/activate-user/activate-user.handler';
import { UserRepository } from '../../../../repositories/user.repository';
import { USER_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(ActivateUserCommand)
export class ActivateUserHandler implements ICommandHandler<ActivateUserCommand> {
  private readonly appHandler: ApplicationActivateUserHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationActivateUserHandler(userRepository);
  }

  async execute(command: ActivateUserCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'USERS',
      recordId: command.userId,
      action: AuditAction.UPDATE,
      changedColumns: ['status'],
      newValues: { status: 'ACTIVE' },
    });
    return result;
  }
}