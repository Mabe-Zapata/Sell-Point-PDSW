import { Customer } from '../../../domain/entities/customer.entity';
import { IdentificationType } from '../../../domain/entities/enums/identification-type.enum';

export class CustomerResponseDto {
  id: string;

  identificationType: IdentificationType;

  identificationNumber: string;

  names: string;

  email?: string;

  phone?: string;

  address?: string;

  createdAt: Date;

  updatedAt: Date;

  constructor(customer: Customer) {
    this.id = customer.id;
    this.identificationType = customer.identificationType;
    this.identificationNumber = customer.identificationNumber;
    this.names = customer.names;
    this.email = customer.email;
    this.phone = customer.phone;
    this.address = customer.address;
    this.createdAt = customer.createdAt;
    this.updatedAt = customer.updatedAt;
  }

  static fromEntity(customer: Customer): CustomerResponseDto {
    return new CustomerResponseDto(customer);
  }

  static fromEntities(customers: Customer[]): CustomerResponseDto[] {
    return customers.map((customer) => new CustomerResponseDto(customer));
  }
}
