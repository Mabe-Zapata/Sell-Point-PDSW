import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ReceiveTransferCommand } from './receive-transfer.command';
import { ReceiveTransferValidator } from './receive-transfer.validator';
import { STOCK_TRANSFER_REPOSITORY } from '../../../../tokens';
import type { IStockTransferRepository } from '../../../../../domain/repositories';
import { TransferStatus } from '../../../../../domain/entities';

@CommandHandler(ReceiveTransferCommand)
export class ReceiveTransferHandler implements ICommandHandler<ReceiveTransferCommand> {
  constructor(
    private readonly validator: ReceiveTransferValidator,
    @Inject(STOCK_TRANSFER_REPOSITORY) private readonly stockTransferRepository: IStockTransferRepository,
  ) {}

  async execute(command: ReceiveTransferCommand): Promise<void> {
    this.validator.validate(command.transferId);

    const transfer = await this.stockTransferRepository.findById(command.transferId);
    if (!transfer) {
      throw new Error(`Transfer with ID '${command.transferId}' not found`);
    }

    const updated = { ...transfer, status: TransferStatus.RECEIVED };
    await this.stockTransferRepository.update(updated as any);
  }
}