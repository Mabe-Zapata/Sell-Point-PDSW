import { User } from '../entities';
import { PaginationParams, PaginatedResult } from './customer.repository.interface';

export interface UserFilters {
  q?: string;
  status?: string;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(
    pagination?: PaginationParams,
    filters?: UserFilters,
  ): Promise<PaginatedResult<User>>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  updateFailedLoginAttempts(id: string, attempts: number): Promise<void>;
  softDelete(id: string): Promise<void>;
}