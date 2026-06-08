import { Injectable, Inject } from '@nestjs/common';
import { InvoiceItem } from '../entities/invoice-item.entity';

export const IVA_CONFIG = 'IVA_CONFIG';

/**
 * TaxCalculator domain service for calculating invoice totals.
 * Handles subtotal, IVA (tax), and total calculations.
 */
@Injectable()
export class TaxCalculator {
  constructor(@Inject(IVA_CONFIG) private readonly taxPercentage: number) {
    if (isNaN(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) {
      throw new Error(
        'IVA_PERCENTAGE must be a valid number between 0 and 100',
      );
    }
  }

  /**
   * Calculate the subtotal from invoice items.
   * Sum of (unitPrice * quantity) for all items.
   */
  calculateSubtotal(items: InvoiceItem[]): number {
    if (!items || items.length === 0) {
      return 0;
    }

    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity;
      return sum + itemTotal;
    }, 0);

    return this.roundToTwoDecimals(subtotal);
  }

  /**
   * Calculate the IVA (tax) amount based on the subtotal.
   * IVA = subtotal * (taxPercentage / 100)
   */
  calculateIva(subtotal: number): number {
    if (subtotal <= 0) {
      return 0;
    }

    const iva = subtotal * (this.taxPercentage / 100);
    return this.roundToTwoDecimals(iva);
  }

  /**
   * Calculate the total amount (subtotal + IVA).
   */
  calculateTotal(subtotal: number, iva: number): number {
    const total = subtotal + iva;
    return this.roundToTwoDecimals(total);
  }

  /**
   * Calculate all totals for an invoice in one call.
   * Returns { subtotal, iva, total }
   */
  calculateAll(items: InvoiceItem[]): {
    subtotal: number;
    iva: number;
    total: number;
  } {
    const subtotal = this.calculateSubtotal(items);
    const iva = this.calculateIva(subtotal);
    const total = this.calculateTotal(subtotal, iva);

    return { subtotal, iva, total };
  }

  /**
   * Get the configured tax percentage
   */
  getTaxPercentage(): number {
    return this.taxPercentage;
  }

  /**
   * Round a number to 2 decimal places for currency precision
   */
  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
