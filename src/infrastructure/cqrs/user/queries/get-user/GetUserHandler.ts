import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserQuery } from '../../../../../application/cqrs/user/queries/get-user/get-user.query';
import { GetUserHandler as ApplicationGetUserHandler } from '../../../../../application/cqrs/user/queries/get-user/get-user.handler';
import { UserRepository } from '../../../../repositories/user.repository';
import { USER_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  private readonly appHandler: ApplicationGetUserHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
  ) {
    this.appHandler = new ApplicationGetUserHandler(userRepository);
  }

  async execute(query: GetUserQuery) {
    return this.appHandler.execute(query);
  }
}
