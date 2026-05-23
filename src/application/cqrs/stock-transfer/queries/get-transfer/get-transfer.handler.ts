import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetTransferQuery } from './get-transfer.query';
import { GetTransferValidator } from './get-transfer.validator';
import { STOCK_TRANSFER_REPOSITORY } from '../../../../tokens';
import type { IStockTransferRepository } from '../../../../../domain/repositories';
import { StockTransfer } from '../../../../../domain/entities';

@QueryHandler(GetTransferQuery)
export class GetTransferHandler implements IQueryHandler<GetTransferQuery> {
  constructor(
    private readonly validator: GetTransferValidator,
    @Inject(STOCK_TRANSFER_REPOSITORY) private readonly stockTransferRepository: IStockTransferRepository,
  ) {}

  async execute(query: GetTransferQuery): Promise<StockTransfer | null> {
    this.validator.validate(query.id);
    return this.stockTransferRepository.findById(query.id);
  }
}