import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateTransferCommand } from './create-transfer.command';
import { CreateTransferValidator } from './create-transfer.validator';
import { STOCK_TRANSFER_REPOSITORY } from '../../../../tokens';
import type { IStockTransferRepository } from '../../../../../domain/repositories';
import { StockTransfer, TransferStatus } from '../../../../../domain/entities';

@CommandHandler(CreateTransferCommand)
export class CreateTransferHandler implements ICommandHandler<CreateTransferCommand> {
  constructor(
    private readonly validator: CreateTransferValidator,
    @Inject(STOCK_TRANSFER_REPOSITORY) private readonly stockTransferRepository: IStockTransferRepository,
  ) {}

  async execute(command: CreateTransferCommand): Promise<StockTransfer> {
    this.validator.validate(command.payload);

    const transfer = new StockTransfer({
      fromBranchId: command.payload.fromBranchId,
      toBranchId: command.payload.toBranchId,
      requesterUserId: command.payload.requesterUserId,
      notes: command.payload.notes,
      status: TransferStatus.REQUESTED,
    });

    return this.stockTransferRepository.create(transfer);
  }
}