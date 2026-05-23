import { Injectable } from '@nestjs/common';

@Injectable()
export class GetTransferValidator {
  validate(id: string): void {
    if (!id) {
      throw new Error('Transfer ID is required');
    }
  }
}