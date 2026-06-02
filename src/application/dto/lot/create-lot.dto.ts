export class CreateLotDto {
  productId!: string;
  lotCode!: string;
  quantityReceived!: number;
  unitCost!: number;
  receivedAt!: string;
  expiresAt?: string;
}
