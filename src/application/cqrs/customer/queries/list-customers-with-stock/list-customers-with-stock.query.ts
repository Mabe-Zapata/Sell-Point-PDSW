import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

// identificationType replaced by cedula (simplify-schema-uta SDD)
export class ListCustomersWithStockQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly q?: string,
    public readonly cedula?: string,
  ) {}
}