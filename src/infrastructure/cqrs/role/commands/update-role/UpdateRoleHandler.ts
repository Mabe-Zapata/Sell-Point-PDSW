import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateRoleCommand } from '../../../../../application/cqrs/role/commands/update-role/update-role.command';
import { UpdateRoleHandler as ApplicationUpdateRoleHandler } from '../../../../../application/cqrs/role/commands/update-role/update-role.handler';
import { RoleRepository } from '../../../../repositories/role.repository';
import { ROLE_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  private readonly appHandler: ApplicationUpdateRoleHandler;

  constructor(
    @Inject(ROLE_REPOSITORY) roleRepository: RoleRepository,
  ) {
    this.appHandler = new ApplicationUpdateRoleHandler(roleRepository);
  }

  async execute(command: UpdateRoleCommand) {
    return this.appHandler.execute(command);
  }
}
