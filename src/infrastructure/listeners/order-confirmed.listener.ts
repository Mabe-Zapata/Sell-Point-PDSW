/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Optional } from '@nestjs/common';
import type { IErrorLogRepository } from '../../domain/repositories';
import { ERROR_LOG_REPOSITORY } from '../common/injection-tokens';
import { ErrorLog } from '../../domain/entities';
import { ExceptionType } from '../../domain/entities/enums';
import type { IEmailService } from '../../application/ports/IEmailService';
import { EMAIL_SERVICE } from '../../application/ports/email-service.token';
import { SaleConfirmedEvent } from '../../domain/events/sale-confirmed.event';
import { OrderConfirmationDTO, OrderItemDTO } from '../../application/dto/order/order-confirmation.dto';

export class OrderConfirmedListener {
  constructor(
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    @Optional()
    @Inject(ERROR_LOG_REPOSITORY)
    private readonly errorLogRepository?: IErrorLogRepository,
  ) {}

  async handle(event: SaleConfirmedEvent): Promise<void> {
    try {
      if (!event.customerEmail) {
        return;
      }

      const items: OrderItemDTO[] = event.details?.map((d) => ({
        productId: d.productId,
        productName: d.productName,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        subtotal: d.subtotal,
      })) ?? [];

      const dto = new OrderConfirmationDTO({
        orderId: event.saleId,
        customerEmail: event.customerEmail,
        customerName: event.customerName || 'Consumidor Final',
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
      const message = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : undefined;
      // Non-fatal: email is not critical path
      console.error(
        `[OrderConfirmedListener] Failed to send order confirmation for sale ${event.saleId}:`,
        error,
      );
      if (this.errorLogRepository) {
        const errorLog = new ErrorLog({
          exceptionType: ExceptionType.EXTERNAL_SERVICE_ERROR,
          message,
          stackTrace,
          source: 'OrderConfirmedListener',
        });
        this.errorLogRepository.create(errorLog).catch(() => undefined);
      }
    }
  }
}
