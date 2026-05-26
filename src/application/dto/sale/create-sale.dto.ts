import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum } from 'class-validator';
import { PaymentMethod } from '../../../domain/entities/enums/payment-method.enum';

export class CreateSaleDto {
  @ApiProperty({ description: 'ID del cliente' })
  @IsUUID()
  customerId!: string;

  @ApiProperty({ description: 'ID de la tasa de impuesto a aplicar' })
  @IsUUID()
  taxRateId!: string;

  @ApiPropertyOptional({
    description: 'Método de pago. Solo se acepta CASH (efectivo)',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod = PaymentMethod.CASH;
}