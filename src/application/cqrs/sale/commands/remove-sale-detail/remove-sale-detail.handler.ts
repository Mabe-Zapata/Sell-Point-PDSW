import { RemoveSaleDetailCommand } from './remove-sale-detail.command';
import type { ISaleDetailRepository } from '../../../../../domain/repositories';

export class RemoveSaleDetailHandler {
  constructor(
    private readonly saleDetailRepository: ISaleDetailRepository,
  ) {}

  async execute(command: RemoveSaleDetailCommand): Promise<void> {
    const detail = await this.saleDetailRepository.findById(command.payload.saleDetailId);
    if (!detail) {
      throw new Error(`Sale detail with ID '${command.payload.saleDetailId}' not found`);
    }

    if (detail.saleId !== command.payload.saleId) {
      throw new Error('Sale detail does not belong to the specified sale');
    }

    await this.saleDetailRepository.deleteBySaleId(command.payload.saleDetailId);
  }
}