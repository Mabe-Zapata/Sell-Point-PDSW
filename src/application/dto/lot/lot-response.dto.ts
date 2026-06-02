import { Lot } from '../../../domain/entities';

export class LotResponseDto {
  id!: string;
  productId!: string;
  lotCode!: string;
  quantityReceived!: number;
  quantityAvailable!: number;
  unitCost!: number;
  estimatedUnitProfit!: number;
  receivedAt!: Date;
  expiresAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(lot: Lot): LotResponseDto {
    return {
      id: lot.id,
      productId: lot.productId,
      lotCode: lot.lotCode,
      quantityReceived: lot.quantityReceived,
      quantityAvailable: lot.quantityAvailable,
      unitCost: lot.unitCost,
      estimatedUnitProfit: lot.estimatedUnitProfit,
      receivedAt: lot.receivedAt,
      expiresAt: lot.expiresAt,
      createdAt: lot.createdAt,
      updatedAt: lot.updatedAt,
    };
  }

  static fromEntities(lots: Lot[]): LotResponseDto[] {
    return lots.map((lot) => LotResponseDto.fromEntity(lot));
  }
}
