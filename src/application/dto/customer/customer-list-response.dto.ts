import { ApiProperty } from '@nestjs/swagger';

export class CustomerListResponseDto {
  @ApiProperty({ description: 'Unique customer identifier', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Identification document number (CI/RUC)', example: '0999999999001' })
  cedula: string;

  @ApiProperty({ description: 'Customer first name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Customer email address', example: 'john.smith@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ description: 'Customer phone number', example: '+593999999999', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Customer physical address', example: 'Av. Amazonas N35-42', nullable: true })
  address: string | null;

  @ApiProperty({ description: 'Whether the customer is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Customer creation timestamp' })
  createdAt: Date;

  constructor(data: {
    id: string;
    cedula: string;
    firstName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    isActive: boolean;
    createdAt: Date;
  }) {
    this.id = data.id;
    this.cedula = data.cedula;
    this.firstName = data.firstName;
    this.email = data.email;
    this.phone = data.phone;
    this.address = data.address;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
  }

  static fromQueryResult(result: {
    id: string;
    cedula: string;
    firstName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    isActive: boolean;
    createdAt: Date;
  }): CustomerListResponseDto {
    return new CustomerListResponseDto(result);
  }

  static fromQueryResults(results: {
    id: string;
    cedula: string;
    firstName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    isActive: boolean;
    createdAt: Date;
  }[]): CustomerListResponseDto[] {
    return results.map((r) => CustomerListResponseDto.fromQueryResult(r));
  }
}
