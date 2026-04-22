import { Customer } from '../../../domain/entities/customer.entity';

export class CustomerResponseDto {
  id: string;

  name: string;

  lastName: string;

  cedula: string;

  email?: string;

  phone?: string;

  address?: string;

  createdAt: Date;

  updatedAt: Date;

  constructor(customer: Customer) {
    this.id = customer.id;
    this.name = customer.name;
    this.lastName = customer.lastName;
    this.cedula = customer.cedula;
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
