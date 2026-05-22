import { Customer } from '../entities';
import { PaginationParams, PaginatedResult } from './pagination.types';

export interface CustomerFilters {
  q?: string;
  identificationType?: string;
}

export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByIdentificationNumber(identificationNumber: string): Promise<Customer | null>;
  findAll(
    pagination?: PaginationParams,
    filters?: CustomerFilters,
  ): Promise<PaginatedResult<Customer>>;
  create(customer: Customer): Promise<Customer>;
  update(customer: Customer): Promise<Customer>;
  softDelete(id: string): Promise<void>;
}
