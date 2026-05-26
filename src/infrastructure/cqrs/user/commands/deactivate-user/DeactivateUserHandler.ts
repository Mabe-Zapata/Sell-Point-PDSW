import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeactivateUserCommand } from '../../../../../application/cqrs/user/commands/deactivate-user/deactivate-user.command';
import { DeactivateUserHandler as ApplicationDeactivateUserHandler } from '../../../../../application/cqrs/user/commands/deactivate-user/deactivate-user.handler';
import { UserRepository } from '../../../../repositories/user.repository';
import { USER_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(DeactivateUserCommand)
export class DeactivateUserHandler implements ICommandHandler<DeactivateUserCommand> {
  private readonly appHandler: ApplicationDeactivateUserHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
  ) {
    this.appHandler = new ApplicationDeactivateUserHandler(userRepository);
  }

  async execute(command: DeactivateUserCommand) {
    return this.appHandler.execute(command);
  }
}
