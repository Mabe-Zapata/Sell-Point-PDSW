import { BadRequestException } from '@nestjs/common';

@Injectable()
export class GenerateInvoicePdfValidator {
  validate(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('Invoice id is required');
    }
    return id;
  }
}
