import { Inject } from '@nestjs/common';
import type { IEmailService } from '../services/interfaces/email-service.interface';
import { EmailTemplate } from '../services/interfaces/email-service.interface';
import { EMAIL_SERVICE } from '../services/email-service.token';
import { SaleConfirmedEvent } from '../../domain/events/sale-confirmed.event';
import { OrderConfirmationDTO, OrderItemDTO } from '../dtos/order/order-confirmation.dto';

export class OrderConfirmedListener {
  constructor(
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async handle(event: SaleConfirmedEvent): Promise<void> {
    try {
      const items: OrderItemDTO[] = event.details?.map((d) => ({
        productId: d.productId,
        productName: d.productName,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        subtotal: d.subtotal,
      })) ?? [];

      const dto = new OrderConfirmationDTO({
        orderId: event.saleId,
        customerEmail: event.customerEmail ?? 'unknown@customer.com',
        customerName: event.customerName ?? 'Customer',
        items,
        total: event.total,
      });

      const result = await this.emailService.send(
        dto.customerEmail,
        EmailTemplate.ORDER_CONFIRMATION,
        dto as unknown as Record<string, unknown>,
      );

      if (!result.success) {
        console.error(`[OrderConfirmedListener] Email send failed: ${result.error}`);
      } else {
        console.info(
          `[OrderConfirmedListener] Order confirmation sent for sale ${event.saleId}`,
        );
      }
    } catch (error) {
      // Non-fatal: email is not critical path
      console.error(
        `[OrderConfirmedListener] Failed to send order confirmation for sale ${event.saleId}:`,
        error,
      );
    }
  }
}
