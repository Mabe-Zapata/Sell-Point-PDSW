import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListUsersQuery } from './list-users.query';
import { ListUsersValidator } from './list-users.validator';
import { USER_REPOSITORY } from '../../../../tokens';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { User } from '../../../../../domain/entities/user.entity';

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(
    private readonly validator: ListUsersValidator,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: ListUsersQuery): Promise<PaginatedResult<User>> {
    this.validator.validate(query.pagination);
    return this.userRepository.findAll(query.pagination, query.filters);
  }
}