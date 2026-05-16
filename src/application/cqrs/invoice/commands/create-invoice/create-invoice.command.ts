import { CreateInvoiceDto } from '../../../../dto/invoice/create-invoice.dto';

export class CreateInvoiceCommand {
  constructor(public readonly payload: CreateInvoiceDto) {}
}
