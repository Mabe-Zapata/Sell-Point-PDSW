import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListTransfersQuery } from './list-transfers.query';
import { ListTransfersValidator } from './list-transfers.validator';
import { STOCK_TRANSFER_REPOSITORY } from '../../../../tokens';
import type { IStockTransferRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { StockTransfer } from '../../../../../domain/entities';

@QueryHandler(ListTransfersQuery)
export class ListTransfersHandler implements IQueryHandler<ListTransfersQuery> {
  constructor(
    private readonly validator: ListTransfersValidator,
    @Inject(STOCK_TRANSFER_REPOSITORY) private readonly stockTransferRepository: IStockTransferRepository,
  ) {}

  async execute(query: ListTransfersQuery): Promise<PaginatedResult<StockTransfer>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.stockTransferRepository.findAll(validPagination, {
      q: query.q,
      fromBranchId: query.fromBranchId,
      toBranchId: query.toBranchId,
      status: query.status,
      requesterUserId: query.requesterUserId,
    });
  }
}