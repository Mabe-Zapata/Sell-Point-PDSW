import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateRoleCommand } from './update-role.command';
import { UpdateRoleValidator } from './update-role.validator';
import { ROLE_REPOSITORY } from '../../../../tokens';
import type { IRoleRepository } from '../../../../../domain/repositories/role.repository.interface';
import { Role } from '../../../../../domain/entities/role.entity';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  constructor(
    private readonly validator: UpdateRoleValidator,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: UpdateRoleCommand): Promise<Role> {
    this.validator.validate(command.roleId);

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