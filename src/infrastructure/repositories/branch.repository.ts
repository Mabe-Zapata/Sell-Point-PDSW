/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchTypeOrmEntity } from '../database/entities/branch.typeorm.entity';
import { Branch } from '../../domain/entities/branch.entity';
import { IBranchRepository, BranchFilters } from '../../domain/repositories/branch.repository.interface';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';

@Injectable()
export class BranchRepository implements IBranchRepository {
  constructor(
    @InjectRepository(BranchTypeOrmEntity)
    private readonly repo: Repository<BranchTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: BranchTypeOrmEntity): Branch {
    return new Branch({
      id: entity.id,
      name: entity.name,
      city: entity.city,
      address: entity.address,
      phone: entity.phone,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(branch: Branch): Partial<BranchTypeOrmEntity> {
    return {
      name: branch.name,
      city: branch.city,
      address: branch.address,
      phone: branch.phone,
      isActive: branch.isActive,
    };
  }

  async findById(id: string): Promise<Branch | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByName(name: string): Promise<Branch | null> {
    const entity = await this.repo.findOne({ where: { name } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: BranchFilters = {},
  ): Promise<PaginatedResult<Branch>> {
    const { page, limit } = pagination;
    const { q, isActive } = filters;

    const queryBuilder = this.repo.createQueryBuilder('branch');

    if (q) {
      queryBuilder.where('branch.name ILIKE :q', { q: `%${q}%` });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('branch.isActive = :isActive', { isActive });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('branch.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async create(branch: Branch): Promise<Branch> {
    const entity = this.repo.create(this.mapToEntity(branch) as BranchTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async update(branch: Branch): Promise<Branch> {
    await this.repo.update(branch.id, this.mapToEntity(branch) as any);
    const updated = await this.repo.findOne({ where: { id: branch.id } });
    if (!updated) throw new Error('Branch not found after update');
    return this.mapToDomain(updated);
  }
}