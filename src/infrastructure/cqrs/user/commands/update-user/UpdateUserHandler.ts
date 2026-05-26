import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateUserCommand } from '../../../../../application/cqrs/user/commands/update-user/update-user.command';
import { UpdateUserHandler as ApplicationUpdateUserHandler } from '../../../../../application/cqrs/user/commands/update-user/update-user.handler';
import { UserRepository } from '../../../../repositories/user.repository';
import { RoleRepository } from '../../../../repositories/role.repository';
import { USER_REPOSITORY, ROLE_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  private readonly appHandler: ApplicationUpdateUserHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
    @Inject(ROLE_REPOSITORY) roleRepository: RoleRepository,
  ) {
    this.appHandler = new ApplicationUpdateUserHandler(userRepository, roleRepository);
  }

  async execute(command: UpdateUserCommand) {
    return this.appHandler.execute(command);
  }
}
