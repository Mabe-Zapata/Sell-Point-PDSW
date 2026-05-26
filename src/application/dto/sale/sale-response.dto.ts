import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../../domain/entities/enums/payment-method.enum';

export class SaleResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() saleNumber!: string;
  @ApiProperty() customerId!: string;
  @ApiProperty() cashierUserId!: string;
  @ApiProperty({ enum: PaymentMethod }) paymentMethod!: PaymentMethod;
  @ApiProperty() status!: string;
  @ApiProperty() subtotal!: number;
  @ApiProperty() taxAmount!: number;
  @ApiProperty() discountAmount!: number;
  @ApiProperty() total!: number;
  @ApiProperty() createdAt!: Date;
}