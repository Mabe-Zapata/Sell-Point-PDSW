import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateUserCommand } from '../../../../../application/cqrs/user/commands/update-user/update-user.command';
import { UpdateUserHandler as ApplicationUpdateUserHandler } from '../../../../../application/cqrs/user/commands/update-user/update-user.handler';
import { UserRepository } from '../../../../repositories/user.repository';
import { USER_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  private readonly appHandler: ApplicationUpdateUserHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
  ) {
    this.appHandler = new ApplicationUpdateUserHandler(userRepository);
  }

  async execute(command: UpdateUserCommand) {
    return this.appHandler.execute(command);
  }
}
