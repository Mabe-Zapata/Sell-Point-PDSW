import { UpdateSaleDetailQuantityCommand } from './update-sale-detail-quantity.command';
import type { ISaleDetailRepository } from '../../../../../domain/repositories';

export class UpdateSaleDetailQuantityHandler {
  constructor(
    private readonly saleDetailRepository: ISaleDetailRepository,
  ) {}

  async execute(command: UpdateSaleDetailQuantityCommand): Promise<void> {
    const detail = await this.saleDetailRepository.findById(command.payload.saleDetailId);
    if (!detail) {
      throw new Error(`Sale detail with ID '${command.payload.saleDetailId}' not found`);
    }

    if (detail.saleId !== command.payload.saleId) {
      throw new Error('Sale detail does not belong to the specified sale');
    }

    detail.quantity = command.payload.quantity;
    await this.saleDetailRepository.update(detail);
  }
}