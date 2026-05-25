import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateRoleCommand } from './create-role.command';
import { CreateRoleValidator } from './create-role.validator';
import { ROLE_REPOSITORY } from '../../../../tokens';
import type { IRoleRepository } from '../../../../../domain/repositories/role.repository.interface';
import { Role } from '../../../../../domain/entities/role.entity';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    private readonly validator: CreateRoleValidator,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: CreateRoleCommand): Promise<Role> {
    this.validator.validate(command.payload);

    const existing = await this.roleRepository.findByName(command.payload.name);
    if (existing) {
      throw new ConflictException(`Role ${command.payload.name} already exists`);
    }

    const role = new Role({
      id: randomUUID(),
      name: command.payload.name,
      description: command.payload.description,
      createdAt: new Date(),
    });

    return this.roleRepository.create(role);
  }
}
