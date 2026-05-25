import { NotFoundException } from '@nestjs/common';
import { GetUserQuery } from './get-user.query';
import { USER_REPOSITORY } from '../../../../tokens';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import { User } from '../../../../../domain/entities/user.entity';
export class GetUserHandler {
  constructor(
    protected readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetUserQuery): Promise<User> {
    const user = await this.userRepository.findById(query.userId);
    if (!user) {
      throw new NotFoundException(`User ${query.userId} not found`);
    }

    return user;
  }
}
