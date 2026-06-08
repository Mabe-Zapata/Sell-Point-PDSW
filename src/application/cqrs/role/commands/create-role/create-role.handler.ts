import { ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateRoleCommand } from './create-role.command';
import type { IRoleRepository } from '../../../../../domain/repositories/role.repository.interface';
import { Role } from '../../../../../domain/entities/role.entity';

export class CreateRoleHandler {
  constructor(
    protected readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: CreateRoleCommand): Promise<Role> {
    const existing = await this.roleRepository.findByName(command.payload.name);
    if (existing) {
      throw new ConflictException(`Role ${command.payload.name} already exists`);
    }

    // TODO: inject IUuidGenerator once ports are wired.
    const role = new Role({
      id: randomUUID(),
      name: command.payload.name,
      description: command.payload.description,
      createdAt: new Date(),
    });

    return this.roleRepository.create(role);
  }
}
