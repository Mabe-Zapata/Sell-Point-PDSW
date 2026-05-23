import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../../../domain/entities/customer.entity';

export class CustomerResponseDto {
  @ApiProperty({ description: 'Unique customer identifier', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Customer first name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Customer last name', example: 'Smith', required: false })
  lastName?: string;

  @ApiProperty({ description: 'Identification document number (CI/RUC)', example: '0999999999001', required: false })
  cedula?: string;

  @ApiProperty({ description: 'Customer email address', example: 'john.smith@example.com', required: false })
  email?: string;

  @ApiProperty({ description: 'Customer phone number', example: '+593999999999', required: false })
  phone?: string;

  @ApiProperty({ description: 'Customer physical address', example: 'Av. Amazonas N35-42 y Francisco de Orellana', required: false })
  address?: string;

  @ApiProperty({ description: 'Whether the customer is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Customer creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Customer last update timestamp' })
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