import { NotFoundException } from '@nestjs/common';
import { UpdateRoleCommand } from './update-role.command';
import type { IRoleRepository } from '../../../../../domain/repositories/role.repository.interface';
import { Role } from '../../../../../domain/entities/role.entity';

export class UpdateRoleHandler {
  constructor(
    protected readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: UpdateRoleCommand): Promise<Role> {
    const role = await this.roleRepository.findById(command.roleId);
    if (!role) {
      throw new NotFoundException(`Role ${command.roleId} not found`);
    }

    const updated = new Role({
      id: role.id,
      name: role.name,
      description: command.payload.description ?? role.description,
      createdAt: role.createdAt,
    });

    return this.roleRepository.update(updated);
  }
}
