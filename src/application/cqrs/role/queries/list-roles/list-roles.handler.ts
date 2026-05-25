import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListRolesQuery } from './list-roles.query';
import { ListRolesValidator } from './list-roles.validator';
import { ROLE_REPOSITORY } from '../../../../tokens';
import type { IRoleRepository } from '../../../../../domain/repositories/role.repository.interface';
import { Role } from '../../../../../domain/entities/role.entity';

@QueryHandler(ListRolesQuery)
export class ListRolesHandler implements IQueryHandler<ListRolesQuery> {
  constructor(
    private readonly validator: ListRolesValidator,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }
}