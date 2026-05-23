import { Injectable } from '@nestjs/common';

@Injectable()
export class ApproveTransferValidator {
  validate(transferId: string, approverUserId: string): void {
    if (!transferId) {
      throw new Error('Transfer ID is required');
    }
    if (!approverUserId) {
      throw new Error('Approver user ID is required');
    }
  }
}