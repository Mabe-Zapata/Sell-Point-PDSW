import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateUserCommand } from '../../../../../application/cqrs/user/commands/create-user/create-user.command';
import { CreateUserHandler as ApplicationCreateUserHandler } from '../../../../../application/cqrs/user/commands/create-user/create-user.handler';
import { AuthService } from '../../../../../infrastructure/services/auth.service';
import { UserRepository } from '../../../../repositories/user.repository';
import { RoleRepository } from '../../../../repositories/role.repository';
import { USER_REPOSITORY, ROLE_REPOSITORY } from '../../../../common/injection-tokens';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  private readonly appHandler: ApplicationCreateUserHandler;

  constructor(
    private readonly authService: AuthService,
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
    @Inject(ROLE_REPOSITORY) roleRepository: RoleRepository,
  ) {
    this.appHandler = new ApplicationCreateUserHandler(authService, userRepository, roleRepository);
  }

  async execute(command: CreateUserCommand) {
    return this.appHandler.execute(command);
  }
}
