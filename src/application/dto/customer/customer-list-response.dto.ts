
export class CustomerListResponseDto {
  id: string;
  cedula: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;

  constructor(data: {
    id: string;
    cedula: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    isActive: boolean;
    createdAt: Date;
  }) {
    this.id = data.id;
    this.cedula = data.cedula;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
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
    lastName: string;
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
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    isActive: boolean;
    createdAt: Date;
  }[]): CustomerListResponseDto[] {
    return results.map((r) => CustomerListResponseDto.fromQueryResult(r));
  }
}

