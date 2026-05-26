import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RegisterEmployeeCommand } from '../../../../../application/cqrs/auth/commands/register-employee/register-employee.command';
import { RegisterEmployeeHandler as ApplicationRegisterEmployeeHandler } from '../../../../../application/cqrs/auth/handlers/register-employee/register-employee.handler';
import { UserRepository } from '../../../../repositories/user.repository';
import { RoleRepository } from '../../../../repositories/role.repository';
import { TypeOrmUnitOfWork } from '../../../../persistence/typeorm/unit-of-work/typeorm-unit-of-work';
import { USER_REPOSITORY, ROLE_REPOSITORY, UNIT_OF_WORK } from '../../../../common/injection-tokens';

@CommandHandler(RegisterEmployeeCommand)
export class RegisterEmployeeHandler implements ICommandHandler<RegisterEmployeeCommand> {
  private readonly appHandler: ApplicationRegisterEmployeeHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
    @Inject(ROLE_REPOSITORY) roleRepository: RoleRepository,
    @Inject(UNIT_OF_WORK) uow: TypeOrmUnitOfWork,
  ) {
    this.appHandler = new ApplicationRegisterEmployeeHandler(userRepository, roleRepository, uow);
  }

  async execute(command: RegisterEmployeeCommand) {
    return this.appHandler.execute(command);
  }
}
