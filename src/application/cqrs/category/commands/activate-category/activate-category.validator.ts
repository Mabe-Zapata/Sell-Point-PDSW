import { Injectable } from '@nestjs/common';

@Injectable()
export class ActivateCategoryValidator {
  validate(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error('Category ID is required');
    }
    return id.trim();
  }
}
