import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CancelTransferCommand } from './cancel-transfer.command';
import { CancelTransferValidator } from './cancel-transfer.validator';
import { STOCK_TRANSFER_REPOSITORY } from '../../../../tokens';
import type { IStockTransferRepository } from '../../../../../domain/repositories';
import { TransferStatus } from '../../../../../domain/entities';

@CommandHandler(CancelTransferCommand)
export class CancelTransferHandler implements ICommandHandler<CancelTransferCommand> {
  constructor(
    private readonly validator: CancelTransferValidator,
    @Inject(STOCK_TRANSFER_REPOSITORY) private readonly stockTransferRepository: IStockTransferRepository,
  ) {}

  async execute(command: CancelTransferCommand): Promise<void> {
    this.validator.validate(command.transferId);

    const transfer = await this.stockTransferRepository.findById(command.transferId);
    if (!transfer) {
      throw new Error(`Transfer with ID '${command.transferId}' not found`);
    }

    const updated = { ...transfer, status: TransferStatus.CANCELLED };
    await this.stockTransferRepository.update(updated as any);
  }
}