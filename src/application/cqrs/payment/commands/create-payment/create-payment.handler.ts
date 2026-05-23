import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreatePaymentCommand } from './create-payment.command';
import { CreatePaymentValidator } from './create-payment.validator';
import { PAYMENT_REPOSITORY } from '../../../../tokens';
import type { IPaymentRepository } from '../../../../../domain/repositories';
import { Payment, PaymentMethod } from '../../../../../domain/entities';

@CommandHandler(CreatePaymentCommand)
export class CreatePaymentHandler implements ICommandHandler<CreatePaymentCommand> {
  constructor(
    private readonly validator: CreatePaymentValidator,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(command: CreatePaymentCommand): Promise<Payment> {
    this.validator.validate(command.payload);

    const payment = new Payment({
      saleId: command.payload.saleId,
      method: command.payload.method as PaymentMethod,
      amount: command.payload.amount,
    });

    return this.paymentRepository.create(payment);
  }
}