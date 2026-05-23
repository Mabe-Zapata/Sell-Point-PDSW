import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SendTransferCommand } from './send-transfer.command';
import { SendTransferValidator } from './send-transfer.validator';
import { STOCK_TRANSFER_REPOSITORY } from '../../../../tokens';
import type { IStockTransferRepository } from '../../../../../domain/repositories';
import { TransferStatus } from '../../../../../domain/entities';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

@CommandHandler(SendTransferCommand)
export class SendTransferHandler implements ICommandHandler<SendTransferCommand> {
  constructor(
    private readonly validator: SendTransferValidator,
    @Inject(STOCK_TRANSFER_REPOSITORY) private readonly stockTransferRepository: IStockTransferRepository,
  ) {}

  async execute(command: SendTransferCommand): Promise<void> {
    this.validator.validate(command.transferId);

    const transfer = await this.stockTransferRepository.findById(command.transferId);
    if (!transfer) {
      throw new Error(`Transfer with ID '${command.transferId}' not found`);
    }

    // R19: Transfer cannot ship without approval
    if (transfer.status !== TransferStatus.APPROVED) {
      throw new BusinessRuleException('Transfer must be approved before it can be sent');
    }

    const updated = { ...transfer, status: TransferStatus.SENT };
    await this.stockTransferRepository.update(updated as any);
  }
}