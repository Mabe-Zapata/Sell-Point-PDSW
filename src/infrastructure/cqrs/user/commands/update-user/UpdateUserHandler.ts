import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateUserCommand } from '../../../../../application/cqrs/user/commands/update-user/update-user.command';
import { UpdateUserHandler as ApplicationUpdateUserHandler } from '../../../../../application/cqrs/user/commands/update-user/update-user.handler';
import { UserRepository } from '../../../../repositories/user.repository';
import { RoleRepository } from '../../../../repositories/role.repository';
import { USER_REPOSITORY, ROLE_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  private readonly appHandler: ApplicationUpdateUserHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
    @Inject(ROLE_REPOSITORY) roleRepository: RoleRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationUpdateUserHandler(userRepository, roleRepository);
  }

  async execute(command: UpdateUserCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'USERS',
      recordId: command.userId,
      action: AuditAction.UPDATE,
      changedColumns: Object.keys(command.payload),
      newValues: { ...command.payload },
    });
    return result;
  }
}
