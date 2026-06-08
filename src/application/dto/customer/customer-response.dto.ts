import { Customer } from '../../../domain/entities';

export class CustomerResponseDto {
  id: string;
  firstName: string;
  lastName?: string;
  cedula?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(customer: Customer) {
    this.id = customer.id;
    this.firstName = customer.firstName;
    this.lastName = customer.lastName;
    this.cedula = customer.cedula;
    this.email = customer.email;
    this.phone = customer.phone;
    this.address = customer.address;
    this.isActive = customer.isActive;
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

