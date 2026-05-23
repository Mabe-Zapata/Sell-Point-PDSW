import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ApproveTransferCommand } from './approve-transfer.command';
import { ApproveTransferValidator } from './approve-transfer.validator';
import { STOCK_TRANSFER_REPOSITORY } from '../../../../tokens';
import type { IStockTransferRepository } from '../../../../../domain/repositories';
import { TransferStatus } from '../../../../../domain/entities';

@CommandHandler(ApproveTransferCommand)
export class ApproveTransferHandler implements ICommandHandler<ApproveTransferCommand> {
  constructor(
    private readonly validator: ApproveTransferValidator,
    @Inject(STOCK_TRANSFER_REPOSITORY) private readonly stockTransferRepository: IStockTransferRepository,
  ) {}

  async execute(command: ApproveTransferCommand): Promise<void> {
    this.validator.validate(command.transferId, command.approverUserId);

    const transfer = await this.stockTransferRepository.findById(command.transferId);
    if (!transfer) {
      throw new Error(`Transfer with ID '${command.transferId}' not found`);
    }

    const updated = {
      ...transfer,
      approverUserId: command.approverUserId,
      status: TransferStatus.APPROVED,
    };

    await this.stockTransferRepository.update(updated as any);
  }
}