import { NotFoundException } from '@nestjs/common';
import { GetRoleQuery } from './get-role.query';
import type { IRoleRepository } from '../../../../../domain/repositories/role.repository.interface';
import { Role } from '../../../../../domain/entities/role.entity';

export class GetRoleHandler {
  constructor(
    protected readonly roleRepository: IRoleRepository,
  ) {}

  async execute(query: GetRoleQuery): Promise<Role> {
    const role = await this.roleRepository.findById(query.roleId);
    if (!role) {
      throw new NotFoundException(`Role ${query.roleId} not found`);
    }

    return role;
  }
}
