import { Injectable } from '@nestjs/common';
import { CreateTransferPayload } from './create-transfer.command';

@Injectable()
export class CreateTransferValidator {
  validate(payload: CreateTransferPayload): void {
    if (!payload.fromBranchId) {
      throw new Error('From branch ID is required');
    }
    if (!payload.toBranchId) {
      throw new Error('To branch ID is required');
    }
    if (!payload.requesterUserId) {
      throw new Error('Requester user ID is required');
    }
    if (payload.fromBranchId === payload.toBranchId) {
      throw new Error('From and to branch cannot be the same');
    }
  }
}