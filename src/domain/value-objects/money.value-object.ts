/**
 * Money value object for handling currency amounts with precision.
 * Uses integer representation (cents) to avoid floating-point precision issues.
 */
export class Money {
  private readonly cents: number;

  private static readonly DECIMAL_PLACES = 2;

  private constructor(cents: number) {
    this.cents = Math.round(cents);
  }

  /**
   * Create a Money instance from a decimal amount
   */
  static fromDecimal(amount: number): Money {
    const cents = Math.round(amount * Math.pow(10, Money.DECIMAL_PLACES));
    return new Money(cents);
  }

  /**
   * Create a Money instance from cents
   */
  static fromCents(cents: number): Money {
    return new Money(cents);
  }

  /**
   * Create a Money instance representing zero
   */
  static zero(): Money {
    return new Money(0);
  }

  /**
   * Get the decimal representation of the amount
   */
  toDecimal(): number {
    return this.cents / Math.pow(10, Money.DECIMAL_PLACES);
  }

  /**
   * Get the cents representation of the amount
   */
  toCents(): number {
    return this.cents;
  }

  /**
   * Add another Money amount to this one
   */
  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  /**
   * Subtract another Money amount from this one
   */
  subtract(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  /**
   * Multiply the amount by a factor
   */
  multiply(factor: number): Money {
    return new Money(this.cents * factor);
  }

  /**
   * Divide the amount by a divisor
   */
  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return new Money(this.cents / divisor);
  }

  /**
   * Check if this amount is equal to another
   */
  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  /**
   * Check if this amount is greater than another
   */
  greaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  /**
   * Check if this amount is less than another
   */
  lessThan(other: Money): boolean {
    return this.cents < other.cents;
  }

  /**
   * Check if this amount is zero
   */
  isZero(): boolean {
    return this.cents === 0;
  }

  /**
   * Check if this amount is positive
   */
  isPositive(): boolean {
    return this.cents > 0;
  }

  /**
   * Check if this amount is negative
   */
  isNegative(): boolean {
    return this.cents < 0;
  }

  /**
   * Format the amount as a string with currency symbol
   */
  format(): string {
    return `$${this.toDecimal().toFixed(Money.DECIMAL_PLACES)}`;
  }

  /**
   * Get the string representation
   */
  toString(): string {
    return this.toDecimal().toString();
  }
}
