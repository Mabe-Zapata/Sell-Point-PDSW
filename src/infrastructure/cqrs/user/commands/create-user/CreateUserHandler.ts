import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateUserCommand } from '../../../../../application/cqrs/user/commands/create-user/create-user.command';
import { CreateUserHandler as ApplicationCreateUserHandler } from '../../../../../application/cqrs/user/commands/create-user/create-user.handler';
import { AuthService } from '../../../../../infrastructure/services/auth.service';
import { UserRepository } from '../../../../repositories/user.repository';
import { RoleRepository } from '../../../../repositories/role.repository';
import { USER_REPOSITORY, ROLE_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  private readonly appHandler: ApplicationCreateUserHandler;

  constructor(
    private readonly authService: AuthService,
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
    @Inject(ROLE_REPOSITORY) roleRepository: RoleRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationCreateUserHandler(authService, userRepository, roleRepository);
  }

  async execute(command: CreateUserCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'USERS',
      recordId: result.id,
      action: AuditAction.INSERT,
      newValues: { email: command.payload.email, role: command.payload.role },
    });
    return result;
  }
}
