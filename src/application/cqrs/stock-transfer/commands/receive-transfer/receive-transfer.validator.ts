import { Injectable } from '@nestjs/common';

@Injectable()
export class ReceiveTransferValidator {
  validate(transferId: string): void {
    if (!transferId) {
      throw new Error('Transfer ID is required');
    }
  }
}