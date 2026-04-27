import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTypeOrmEntity } from '../database/entities/user.typeorm.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly repo: Repository<UserTypeOrmEntity>,
  ) {}

  async findByEmployeeId(
    employeeId: string,
  ): Promise<UserTypeOrmEntity | null> {
    return this.repo.findOne({
      where: { employeeId, isActive: true },
      withDeleted: false,
    });
  }
}
