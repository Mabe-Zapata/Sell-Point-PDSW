import { CreateCustomerDto } from '../../../../dto/customer/create-customer.dto';

export class CreateCustomerCommand {
  constructor(public readonly payload: CreateCustomerDto) {}
}
