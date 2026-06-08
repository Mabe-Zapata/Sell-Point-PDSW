export class GetErrorLogValidator {
  static validate(id: number): void {
    if (!id) {
      throw new Error('Error log ID is required');
    }
  }
}