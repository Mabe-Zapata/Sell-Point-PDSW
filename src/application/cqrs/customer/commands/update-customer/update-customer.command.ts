import { UpdateCustomerDto } from '../../../../dto/customer/update-customer.dto';

export class UpdateCustomerCommand {
  constructor(
    public readonly id: string,
    public readonly payload: UpdateCustomerDto,
  ) {}
}
