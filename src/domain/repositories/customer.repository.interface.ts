import { Customer } from '../entities/customer.entity';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface CustomerFilters {
  q?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Customer repository interface
 * Defines the contract for customer data access operations
 */
export interface ICustomerRepository {
  /**
   * Find a customer by ID
   */
  findById(id: string): Promise<Customer | null>;

  /**
   * Find a customer by cedula (identification number)
   */
  findByCedula(cedula: string): Promise<Customer | null>;

  /**
   * Find all customers with pagination and filters (excluding soft-deleted)
   */
  findAll(
    pagination?: PaginationParams,
    filters?: CustomerFilters,
  ): Promise<PaginatedResult<Customer>>;

  /**
   * Create a new customer
   */
  create(customer: Customer): Promise<Customer>;

  /**
   * Update an existing customer
   */
  update(customer: Customer): Promise<Customer>;

  /**
   * Soft delete a customer (mark as deleted)
   */
  softDelete(id: string): Promise<void>;
}
