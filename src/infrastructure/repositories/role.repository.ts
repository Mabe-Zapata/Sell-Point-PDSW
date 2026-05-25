import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleTypeOrmEntity } from '../database/entities/role.typeorm.entity';
import { Role } from '../../domain/entities';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleTypeOrmEntity)
    private readonly repo: Repository<RoleTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: RoleTypeOrmEntity): Role {
    return new Role({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
    });
  }

  private mapToEntity(role: Role): Partial<RoleTypeOrmEntity> {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
    };
  }

  async findById(id: string): Promise<Role | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const entity = await this.repo.findOne({ where: { name } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(): Promise<Role[]> {
    const entities = await this.repo.find();
    return entities.map((e) => this.mapToDomain(e));
  }

  async create(role: Role): Promise<Role> {
    const entity = this.repo.create(this.mapToEntity(role));
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }
}
