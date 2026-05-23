import { Injectable } from '@nestjs/common';
import { CreateBranchPayload } from './create-branch.command';

@Injectable()
export class CreateBranchValidator {
  validate(payload: CreateBranchPayload): void {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Branch name is required');
    }
  }
}