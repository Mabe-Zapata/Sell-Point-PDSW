import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateRoleCommand } from '../../../../../application/cqrs/role/commands/create-role/create-role.command';
import { CreateRoleHandler as ApplicationCreateRoleHandler } from '../../../../../application/cqrs/role/commands/create-role/create-role.handler';
import { RoleRepository } from '../../../../repositories/role.repository';
import { ROLE_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  private readonly appHandler: ApplicationCreateRoleHandler;

  constructor(
    @Inject(ROLE_REPOSITORY) roleRepository: RoleRepository,
  ) {
    this.appHandler = new ApplicationCreateRoleHandler(roleRepository);
  }

  async execute(command: CreateRoleCommand) {
    return this.appHandler.execute(command);
  }
}
