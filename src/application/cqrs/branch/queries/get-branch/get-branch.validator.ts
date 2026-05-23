import { Injectable } from '@nestjs/common';

@Injectable()
export class GetBranchValidator {
  validate(id: string): void {
    if (!id) {
      throw new Error('Branch ID is required');
    }
  }
}