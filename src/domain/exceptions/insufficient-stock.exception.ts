import { DomainException } from './domain.exception';

/**
 * Exception thrown when there is insufficient stock for a product
 */
export class InsufficientStockException extends DomainException {
  constructor(
    productName: string,
    requestedQuantity: number,
    availableQuantity: number,
  ) {
    super(
      `Stock insuficiente para el producto ${productName}. Solicitado: ${requestedQuantity}, Disponible: ${availableQuantity}`,
    );
    this.name = 'InsufficientStockException';
  }
}
