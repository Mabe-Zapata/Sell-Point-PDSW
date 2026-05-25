import { GetSaleQuery } from './get-sale.query';
import { SALE_REPOSITORY } from '../../../../tokens';
import type { ISaleRepository } from '../../../../../domain/repositories';
import { Sale } from '../../../../../domain/entities';
export class GetSaleHandler {
  constructor(
    protected readonly saleRepository: ISaleRepository,
  ) {}

  async execute(query: GetSaleQuery): Promise<Sale | null> {
    return this.saleRepository.findById(query.id);
  }
}
