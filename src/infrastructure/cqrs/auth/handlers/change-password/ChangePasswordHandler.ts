import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ChangePasswordCommand } from '../../../../../application/cqrs/auth/commands/change-password/change-password.command';
import { ChangePasswordHandler as ApplicationChangePasswordHandler } from '../../../../../application/cqrs/auth/handlers/change-password/change-password.handler';
import { UserRepository } from '../../../../repositories/user.repository';
import { USER_REPOSITORY, UNIT_OF_WORK } from '../../../../common/injection-tokens';
import type { IUnitOfWork } from '../../../../../application/unit-of-work/unit-of-work.interface';

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand> {
  private readonly appHandler: ApplicationChangePasswordHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
    @Inject(UNIT_OF_WORK) uow: IUnitOfWork,
  ) {
    this.appHandler = new ApplicationChangePasswordHandler(userRepository, uow);
  }

  async execute(command: ChangePasswordCommand) {
    return this.appHandler.execute(command);
  }
}
