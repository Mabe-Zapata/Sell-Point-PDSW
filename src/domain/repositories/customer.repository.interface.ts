import { Customer } from '../entities';
import { PaginationParams, PaginatedResult } from './pagination.types';

// identificationType removed — replaced by cedula (simplify-schema-uta SDD)
export interface CustomerFilters {
  q?: string;
  cedula?: string;
  isActive?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByIdentificationNumber(cedula: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findAll(
    pagination?: PaginationParams,
    filters?: CustomerFilters,
  ): Promise<PaginatedResult<Customer>>;
  create(customer: Customer): Promise<Customer>;
  update(customer: Customer): Promise<Customer>;
  softDelete(id: string): Promise<void>;
}
