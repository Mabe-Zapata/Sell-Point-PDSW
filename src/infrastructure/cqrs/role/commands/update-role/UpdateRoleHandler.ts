import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateRoleCommand } from '../../../../../application/cqrs/role/commands/update-role/update-role.command';
import { UpdateRoleHandler as ApplicationUpdateRoleHandler } from '../../../../../application/cqrs/role/commands/update-role/update-role.handler';
import { RoleRepository } from '../../../../repositories/role.repository';
import { ROLE_REPOSITORY } from '../../../../common/injection-tokens';
import { AuditService } from '../../../../services/audit.service';
import { AuditAction } from '../../../../../domain/entities/audit-log.entity';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  private readonly appHandler: ApplicationUpdateRoleHandler;

  constructor(
    @Inject(ROLE_REPOSITORY) roleRepository: RoleRepository,
    private readonly auditService: AuditService,
  ) {
    this.appHandler = new ApplicationUpdateRoleHandler(roleRepository);
  }

  async execute(command: UpdateRoleCommand) {
    const result = await this.appHandler.execute(command);
    this.auditService.audit({
      tableName: 'ROLES',
      recordId: command.roleId,
      action: AuditAction.UPDATE,
      changedColumns: ['description'],
      newValues: { description: command.payload.description },
    });
    return result;
  }
}