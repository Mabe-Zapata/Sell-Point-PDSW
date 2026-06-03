import { User } from '../entities';
import { PaginationParams, PaginatedResult } from './pagination.types';

export interface UserFilters {
  q?: string;
  status?: string;
  role?: string;
  username?: string;
  email?: string;
  employeeId?: string;
  isActive?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmployeeId(employeeId: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByCedula(cedula: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findAll(
    pagination?: PaginationParams,
    filters?: UserFilters,
  ): Promise<PaginatedResult<User>>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  updateFailedLoginAttempts(id: string, attempts: number): Promise<void>;
  softDelete(id: string): Promise<void>;
}
