import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ResetPasswordCommand } from '../../../../../application/cqrs/auth/commands/reset-password/reset-password.command';
import { ResetPasswordHandler as ApplicationResetPasswordHandler } from '../../../../../application/cqrs/auth/handlers/reset-password/reset-password.handler';
import { UserRepository } from '../../../../repositories/user.repository';
import { PasswordResetTokenRepository } from '../../../../repositories/password-reset-token.repository';
import { USER_REPOSITORY, PASSWORD_RESET_TOKEN_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand> {
  private readonly appHandler: ApplicationResetPasswordHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY) tokenRepository: PasswordResetTokenRepository,
  ) {
    this.appHandler = new ApplicationResetPasswordHandler(userRepository, tokenRepository);
  }

  async execute(command: ResetPasswordCommand) {
    return this.appHandler.execute(command);
  }
}
