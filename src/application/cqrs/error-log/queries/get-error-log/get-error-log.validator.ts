import { Injectable } from '@nestjs/common';

@Injectable()
export class GetErrorLogValidator {
  validate(id: number): void {
    if (!id) {
      throw new Error('Error log ID is required');
    }
  }
}