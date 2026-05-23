import { Injectable } from '@nestjs/common';
import { UpdateBranchPayload } from './update-branch.command';

@Injectable()
export class UpdateBranchValidator {
  validate(id: string, payload: UpdateBranchPayload): void {
    if (!id) {
      throw new Error('Branch ID is required');
    }
    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Branch name cannot be empty');
    }
  }
}