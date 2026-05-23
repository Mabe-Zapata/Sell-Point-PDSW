import { Injectable } from '@nestjs/common';

@Injectable()
export class GetCategoryValidator {
  validate(id: string): void {
    if (!id) {
      throw new Error('Category ID is required');
    }
  }
}