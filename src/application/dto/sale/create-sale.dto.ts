import { IsUUID, IsEnum } from 'class-validator';
import { PaymentMethod } from '../../../domain/entities/enums/payment-method.enum';

export class CreateSaleDto {
  @IsUUID()
  customerId!: string;
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod = PaymentMethod.CASH;
}
