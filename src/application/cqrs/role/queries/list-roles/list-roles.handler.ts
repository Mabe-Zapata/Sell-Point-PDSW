import { ListRolesQuery } from './list-roles.query';
import { ROLE_REPOSITORY } from '../../../../tokens';
import type { IRoleRepository } from '../../../../../domain/repositories/role.repository.interface';
import { Role } from '../../../../../domain/entities/role.entity';
export class ListRolesHandler {
  constructor(
    protected readonly roleRepository: IRoleRepository,
  ) {}

  async execute(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }
}
