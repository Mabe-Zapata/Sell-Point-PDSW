import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateRoleCommand } from '../../../../../application/cqrs/role/commands/create-role/create-role.command';
import { CreateRoleHandler as ApplicationCreateRoleHandler } from '../../../../../application/cqrs/role/commands/create-role/create-role.handler';
import { RoleRepository } from '../../../../repositories/role.repository';
import { ROLE_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  private readonly appHandler: ApplicationCreateRoleHandler;

  constructor(
    @Inject(ROLE_REPOSITORY) roleRepository: RoleRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationCreateRoleHandler(roleRepository);
  }

  async execute(command: CreateRoleCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'ROLES',
      recordId: result.id,
      action: AuditAction.INSERT,
      newValues: { name: command.payload.name },
    });
    return result;
  }
}
