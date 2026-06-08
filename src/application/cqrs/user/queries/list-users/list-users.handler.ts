import { ListUsersQuery } from './list-users.query';
import { USER_REPOSITORY } from '../../../../tokens';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { User } from '../../../../../domain/entities/user.entity';export class ListUsersHandler {
  constructor(
    protected readonly userRepository: IUserRepository,
  ) {}

  async execute(query: ListUsersQuery): Promise<PaginatedResult<User>> {
    return this.userRepository.findAll(query.pagination, query.filters);
  }
}
