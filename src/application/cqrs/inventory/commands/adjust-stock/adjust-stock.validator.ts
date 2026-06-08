import { BadRequestException } from '@nestjs/common';
import { AdjustStockDto } from '../../../../dto/stock/adjust-stock.dto';
import { StockMovementType } from '../../../../../domain/entities/enums/stock-movement-type.enum';export class AdjustStockValidator {
  static validate(dto: AdjustStockDto): void {
    if (dto.quantity === 0) {
      throw new BadRequestException('Quantity must not be zero');
    }

    if ((dto.type === StockMovementType.IN || dto.type === StockMovementType.OUT) && dto.quantity < 0) {
      throw new BadRequestException(
        `Negative quantity is not allowed for ${dto.type} type. Use ADJUSTMENT for negative adjustments.`,
      );
    }
  }
}
