export interface OrderItemDTO {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class OrderConfirmationDTO {
  readonly orderId: string;
  readonly customerEmail: string;
  readonly customerName: string;
  readonly items: OrderItemDTO[];
  readonly total: number;

  constructor(params: {
    orderId: string;
    customerEmail: string;
    customerName: string;
    items: OrderItemDTO[];
    total: number;
  }) {
    this.orderId = params.orderId;
    this.customerEmail = params.customerEmail;
    this.customerName = params.customerName;
    this.items = params.items;
    this.total = params.total;
  }
}