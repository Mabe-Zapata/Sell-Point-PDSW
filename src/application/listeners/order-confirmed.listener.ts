/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject } from '@nestjs/common';
import type { IEmailService } from '../ports/IEmailService';
import { EMAIL_SERVICE } from '../ports/email-service.token';
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

      const result = await this.emailService.sendInvoice(
        dto.customerEmail,
        event.saleId,
        {
          invoiceNumber: event.saleId,
          date: new Date().toLocaleDateString('es-EC'),
          customerName: dto.customerName,
          items: items.map((item) => ({
            description: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
          total: dto.total,
        },
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
