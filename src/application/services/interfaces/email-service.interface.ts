export enum EmailTemplate {
  ORDER_CONFIRMATION = 'order-confirmation',
  SALE_CANCELLED = 'sale-cancelled',
  INVOICE = 'invoice',
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailService {
  send(to: string, template: EmailTemplate, data: Record<string, unknown>): Promise<SendResult>;
}