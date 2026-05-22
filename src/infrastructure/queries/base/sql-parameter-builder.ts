/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
export class SqlParameterBuilder {
  private params: any[] = [];
  private paramIndex = 1;

  add(value: any): string {
    this.params.push(value);
    return `$${this.paramIndex++}`;
  }

  addOptional(value: any | undefined | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    this.params.push(value);
    return `$${this.paramIndex++}`;
  }

  addArray(values: any[]): string {
    if (!values || values.length === 0) {
      return "NULL";
    }
    const placeholders = values.map(() => {
      this.params.push(values[this.params.length]);
      return `$${this.paramIndex++}`;
    });
    return placeholders.join(', ');
  }

  build(): { text: string; values: any[] } {
    return { text: '', values: this.params };
  }

  reset(): void {
    this.params = [];
    this.paramIndex = 1;
  }

  getParams(): any[] {
    return this.params;
  }
}

export function escapeIdentifier(identifier: string): string {
  return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}
