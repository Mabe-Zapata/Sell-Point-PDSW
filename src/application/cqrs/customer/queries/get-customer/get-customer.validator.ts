import { BadRequestException } from '@nestjs/common';

@Injectable()
export class GetCustomerValidator {
  validate(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('Customer id is required');
    }
    return id;
  }
}
