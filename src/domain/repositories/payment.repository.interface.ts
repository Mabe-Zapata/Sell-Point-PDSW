import { Payment } from '../entities';
import { PaginationParams, PaginatedResult } from './customer.repository.interface';

export interface PaymentFilters {
  saleId?: string;
  method?: string;
}

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findBySaleId(saleId: string): Promise<Payment[]>;
  findAll(
    pagination?: PaginationParams,
    filters?: PaymentFilters,
  ): Promise<PaginatedResult<Payment>>;
  create(payment: Payment): Promise<Payment>;
}