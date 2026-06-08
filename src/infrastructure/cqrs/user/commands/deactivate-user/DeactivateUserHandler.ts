import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeactivateUserCommand } from '../../../../../application/cqrs/user/commands/deactivate-user/deactivate-user.command';
import { DeactivateUserHandler as ApplicationDeactivateUserHandler } from '../../../../../application/cqrs/user/commands/deactivate-user/deactivate-user.handler';
import { UserRepository } from '../../../../repositories/user.repository';
import { USER_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(DeactivateUserCommand)
export class DeactivateUserHandler implements ICommandHandler<DeactivateUserCommand> {
  private readonly appHandler: ApplicationDeactivateUserHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationDeactivateUserHandler(userRepository);
  }

  async execute(command: DeactivateUserCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'USERS',
      recordId: command.userId,
      action: AuditAction.DELETE,
      metadata: { reason: 'soft-delete' },
    });
    return result;
  }
}
