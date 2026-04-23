import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { IsUUID, validateOrReject } from 'class-validator';
import { InvoiceRepository } from '../../../../../infrastructure/repositories/invoice.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Invoice } from '../../../../../domain/entities/invoice.entity';

class InvoiceIdParam {
  @IsUUID()
  id: string;
}

@Injectable()
export class GenerateInvoicePdfValidator {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async validate(id: string): Promise<Invoice> {
    // Validate UUID format
    if (!id || id.trim() === '') {
      throw new BadRequestException('El identificador de factura es requerido');
    }

    const param = new InvoiceIdParam();
    param.id = id;

    try {
      await validateOrReject(param);
    } catch (errors) {
      throw new BadRequestException('El identificador de factura debe ser un UUID válido');
    }

    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new EntityNotFoundException('Invoice', id);
    }
    return invoice;
  }
}
