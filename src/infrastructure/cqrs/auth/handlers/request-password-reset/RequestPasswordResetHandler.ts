import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestPasswordResetCommand } from '../../../../../application/cqrs/auth/commands/request-password-reset/request-password-reset.command';
import { RequestPasswordResetHandler as ApplicationRequestPasswordResetHandler } from '../../../../../application/cqrs/auth/handlers/request-password-reset/request-password-reset.handler';
import { UserRepository } from '../../../../repositories/user.repository';
import { PasswordResetTokenRepository } from '../../../../repositories/password-reset-token.repository';
import { TypeOrmUnitOfWork } from '../../../../persistence/typeorm/unit-of-work/typeorm-unit-of-work';
import { USER_REPOSITORY, PASSWORD_RESET_TOKEN_REPOSITORY, UNIT_OF_WORK } from '../../../../common/injection-tokens';

@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler implements ICommandHandler<RequestPasswordResetCommand> {
  private readonly appHandler: ApplicationRequestPasswordResetHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY) tokenRepository: PasswordResetTokenRepository,
    @Inject(UNIT_OF_WORK) uow: TypeOrmUnitOfWork,
    private readonly configService: ConfigService,
  ) {
    this.appHandler = new ApplicationRequestPasswordResetHandler(userRepository, tokenRepository, uow, configService);
  }

  async execute(command: RequestPasswordResetCommand) {
    return this.appHandler.execute(command);
  }
}
