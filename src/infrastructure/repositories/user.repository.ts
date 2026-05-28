import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTypeOrmEntity } from '../database/entities/user.typeorm.entity';
import { UserRoleTypeOrmEntity } from '../database/entities/user-role.typeorm.entity';
import { RoleTypeOrmEntity } from '../database/entities/role.typeorm.entity';
import { User } from '../../domain/entities';
import { UserStatusMapper } from '../database/entities/enums/user-status.db-enum';
import type { IUserRepository, UserFilters, PaginationParams, PaginatedResult } from '../../domain/repositories';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly repo: Repository<UserTypeOrmEntity>,
    @InjectRepository(UserRoleTypeOrmEntity)
    private readonly userRoleRepo: Repository<UserRoleTypeOrmEntity>,
    @InjectRepository(RoleTypeOrmEntity)
    private readonly roleRepo: Repository<RoleTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: UserTypeOrmEntity): User {
    return new User({
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      cedula: entity.cedula,
      role: entity.userRole?.role?.name,
      employeeId: entity.employeeId,
      username: entity.username,
      email: entity.email,
      passwordHash: entity.passwordHash,
      currentPasswordHash: entity.currentPasswordHash,
      passwordExpired: entity.passwordExpired,
      status: UserStatusMapper.toDomain(entity.status),
      defaultBranchId: entity.defaultBranchId,
      failedLoginAttempts: entity.failedLoginAttempts,
      googleId: entity.googleId ?? undefined,
      googleEmail: entity.googleEmail ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private mapToEntity(user: User): Partial<UserTypeOrmEntity> {
    return {
      id: user.id,
      employeeId: user.employeeId,
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
      currentPasswordHash: user.currentPasswordHash,
      passwordExpired: user.passwordExpired,
      firstName: user.firstName,
      lastName: user.lastName,
      cedula: user.cedula,
      status: UserStatusMapper.toDb(user.status),
      defaultBranchId: user.defaultBranchId,
      failedLoginAttempts: user.failedLoginAttempts,
      googleId: user.googleId ?? null,
      googleEmail: user.googleEmail ?? null,
    };
  }

  private createBaseQueryBuilder() {
    return this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRole', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role');
  }

  private async findOneBy(field: 'id' | 'employeeId' | 'username' | 'email', value: string): Promise<User | null> {
    const entity = await this.createBaseQueryBuilder()
      .where(`user.${field} = :value`, { value })
      .getOne();

    return entity ? this.mapToDomain(entity) : null;
  }

  private async resolveRole(roleName: string): Promise<RoleTypeOrmEntity> {
    const role = await this.roleRepo.findOne({ where: { name: roleName } });
    if (!role) {
      throw new BadRequestException(`Role ${roleName} does not exist`);
    }

    return role;
  }

  private async upsertUserRole(userId: string, roleName?: string): Promise<void> {
    if (!roleName) {
      await this.userRoleRepo.delete({ userId });
      return;
    }

    const role = await this.resolveRole(roleName);
    await this.userRoleRepo.delete({ userId });
    await this.userRoleRepo.save(this.userRoleRepo.create({ userId, roleId: role.id }));
  }

  async findById(id: string): Promise<User | null> {
    return this.findOneBy('id', id);
  }

  async findByEmployeeId(employeeId: string): Promise<User | null> {
    return this.findOneBy('employeeId', employeeId);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.findOneBy('username', username);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOneBy('email', email);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const entity = await this.createBaseQueryBuilder()
      .where('user.googleId = :googleId', { googleId })
      .getOne();

    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: UserFilters = {},
  ): Promise<PaginatedResult<User>> {
    const { page, limit } = pagination;
    const { q, status, role, username, email, employeeId, isActive } = filters;

    const queryBuilder = this.createBaseQueryBuilder().where('1=1');

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
      queryBuilder.andWhere('role.name = :role', { role });
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
    const resolvedRole = user.role ? await this.resolveRole(user.role) : null;
    const saved = await this.repo.manager.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserTypeOrmEntity);
      const userRoleRepo = manager.getRepository(UserRoleTypeOrmEntity);

      const entity = userRepo.create(this.mapToEntity(user));
      const persisted = await userRepo.save(entity);

      await userRoleRepo.delete({ userId: persisted.id });
      if (resolvedRole) {
        await userRoleRepo.save(userRoleRepo.create({ userId: persisted.id, roleId: resolvedRole.id }));
      }

      return persisted;
    });
    const created = await this.findById(saved.id);
    if (!created) throw new Error('User not found after create');
    return created;
  }

  async update(user: User): Promise<User> {
    const resolvedRole = user.role ? await this.resolveRole(user.role) : null;
    await this.repo.manager.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserTypeOrmEntity);
      const userRoleRepo = manager.getRepository(UserRoleTypeOrmEntity);

      const entity = await userRepo.findOne({ where: { id: user.id } });
      if (!entity) throw new Error('User not found');

      entity.googleId = user.googleId ?? null;
      entity.googleEmail = user.googleEmail ?? null;

      await userRepo.save(entity);

      await userRoleRepo.delete({ userId: user.id });
      if (resolvedRole) {
        await userRoleRepo.save(userRoleRepo.create({ userId: user.id, roleId: resolvedRole.id }));
      }
    });
    const updated = await this.findById(user.id);
    if (!updated) throw new Error('User not found after update');
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await this.userRoleRepo.delete({ userId: id });
    await this.repo.delete(id);
  }

  async updateFailedLoginAttempts(id: string, attempts: number): Promise<void> {
    await this.repo.update(id, { failedLoginAttempts: attempts });
  }
}