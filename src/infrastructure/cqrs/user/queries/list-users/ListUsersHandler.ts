import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListUsersQuery } from '../../../../../application/cqrs/user/queries/list-users/list-users.query';
import { ListUsersHandler as ApplicationListUsersHandler } from '../../../../../application/cqrs/user/queries/list-users/list-users.handler';
import { UserRepository } from '../../../../repositories/user.repository';
import { USER_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  private readonly appHandler: ApplicationListUsersHandler;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: UserRepository,
  ) {
    this.appHandler = new ApplicationListUsersHandler(userRepository);
  }

  async execute(query: ListUsersQuery) {
    return this.appHandler.execute(query);
  }
}
