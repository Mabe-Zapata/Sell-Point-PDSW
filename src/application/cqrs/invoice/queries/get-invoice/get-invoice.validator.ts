import { BadRequestException } from '@nestjs/common';

@Injectable()
export class GetInvoiceValidator {
  validate(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('Invoice id is required');
    }
    return id;
  }
}
