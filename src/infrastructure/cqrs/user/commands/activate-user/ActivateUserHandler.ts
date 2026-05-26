import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ActivateUserCommand } from '../../../../../application/cqrs/user/commands/activate-user/activate-user.command';
import { ActivateUserHandler as ApplicationActivateUserHandler } from '../../../../../application/cqrs/user/commands/activate-user/activate-user.handler';
import { UserRepository } from '../../../../repositories/user.repository';
import { USER_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(ActivateUserCommand)
export class ActivateUserHandler implements ICommandHandler<ActivateUserCommand> {
  private readonly appHandler: ApplicationActivateUserHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
  ) {
    this.appHandler = new ApplicationActivateUserHandler(userRepository);
  }

  async execute(command: ActivateUserCommand) {
    return this.appHandler.execute(command);
  }
}
