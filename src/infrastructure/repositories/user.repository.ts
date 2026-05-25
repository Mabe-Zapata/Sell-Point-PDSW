import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTypeOrmEntity } from '../database/entities/user.typeorm.entity';
import { User } from '../../domain/entities';
import { UserStatusMapper } from '../database/entities/enums/user-status.db-enum';
import type { IUserRepository, UserFilters, PaginationParams, PaginatedResult } from '../../domain/repositories';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly repo: Repository<UserTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: UserTypeOrmEntity): User {
    return new User({
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      cedula: entity.cedula,
      role: entity.role,
      employeeId: entity.employeeId,
      username: entity.username,
      email: entity.email,
      passwordHash: entity.passwordHash,
      status: UserStatusMapper.toDomain(entity.status),
      defaultBranchId: entity.defaultBranchId,
      failedLoginAttempts: entity.failedLoginAttempts,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(user: User): Partial<UserTypeOrmEntity> {
    return {
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      passwordHash: user.passwordHash,
      status: UserStatusMapper.toDb(user.status),
      defaultBranchId: user.defaultBranchId,
      failedLoginAttempts: user.failedLoginAttempts,
    };
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByEmployeeId(employeeId: string): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { employeeId } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { username } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { email } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: UserFilters = {},
  ): Promise<PaginatedResult<User>> {
    const { page, limit } = pagination;
    const { q, status, role, username, email, employeeId, isActive } = filters;

    const queryBuilder = this.repo.createQueryBuilder('user').where('1=1');

    if (q) {
      queryBuilder.where(
        '(LOWER(user.employeeId) LIKE LOWER(:q) OR LOWER(user.email) LIKE LOWER(:q) OR LOWER(user.username) LIKE LOWER(:q))',
        {
          q: `%${q}%`,
        },
      );
    }
    if (employeeId) {
      queryBuilder.andWhere('user.employeeId = :employeeId', { employeeId });
    }
    if (username) {
      queryBuilder.andWhere('LOWER(user.username) LIKE LOWER(:username)', {
        username: `%${username}%`,
      });
    }
    if (email) {
      queryBuilder.andWhere('LOWER(user.email) LIKE LOWER(:email)', {
        email: `%${email}%`,
      });
    }
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere(isActive ? 'user.status = :activeStatus' : 'user.status <> :activeStatus', {
        activeStatus: 'ACTIVE',
      });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('user.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async create(user: User): Promise<User> {
    const entity = this.repo.create(this.mapToEntity(user) as UserTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async update(user: User): Promise<User> {
    await this.repo.update(user.id, this.mapToEntity(user) as any);
    const updated = await this.repo.findOne({ where: { id: user.id } });
    if (!updated) throw new Error('User not found after update');
    return this.mapToDomain(updated);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async updateFailedLoginAttempts(id: string, attempts: number): Promise<void> {
    await this.repo.update(id, { failedLoginAttempts: attempts } as any);
  }
}
