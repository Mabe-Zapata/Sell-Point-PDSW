import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UnlockUserCommand } from '../../../../../application/cqrs/user/commands/unlock-user/unlock-user.command';
import { UnlockUserHandler as ApplicationUnlockUserHandler } from '../../../../../application/cqrs/user/commands/unlock-user/unlock-user.handler';
import { UserRepository } from '../../../../repositories/user.repository';
import { USER_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(UnlockUserCommand)
export class UnlockUserHandler implements ICommandHandler<UnlockUserCommand> {
  private readonly appHandler: ApplicationUnlockUserHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
  ) {
    this.appHandler = new ApplicationUnlockUserHandler(userRepository);
  }

  async execute(command: UnlockUserCommand) {
    return this.appHandler.execute(command);
  }
}
