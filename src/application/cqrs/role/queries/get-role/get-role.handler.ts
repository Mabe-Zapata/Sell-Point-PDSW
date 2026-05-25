import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetRoleQuery } from './get-role.query';
import { GetRoleValidator } from './get-role.validator';
import { ROLE_REPOSITORY } from '../../../../tokens';
import type { IRoleRepository } from '../../../../../domain/repositories/role.repository.interface';
import { Role } from '../../../../../domain/entities/role.entity';

@QueryHandler(GetRoleQuery)
export class GetRoleHandler implements IQueryHandler<GetRoleQuery> {
  constructor(
    private readonly validator: GetRoleValidator,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(query: GetRoleQuery): Promise<Role> {
    this.validator.validate(query.roleId);

    const role = await this.roleRepository.findById(query.roleId);
    if (!role) {
      throw new NotFoundException(`Role ${query.roleId} not found`);
    }

    return role;
  }
}