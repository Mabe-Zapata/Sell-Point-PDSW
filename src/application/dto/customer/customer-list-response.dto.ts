export class CustomerListResponseDto {
  id: string;
  // identificationType/identificationNumber replaced by cedula (simplify-schema-uta SDD)
  cedula: string;
  names: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;

  constructor(data: {
    id: string;
    cedula: string;
    names: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    createdAt: Date;
  }) {
    this.id = data.id;
    this.cedula = data.cedula;
    this.names = data.names;
    this.email = data.email;
    this.phone = data.phone;
    this.address = data.address;
    this.createdAt = data.createdAt;
  }

  static fromQueryResult(result: {
    id: string;
    cedula: string;
    names: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    createdAt: Date;
  }): CustomerListResponseDto {
    return new CustomerListResponseDto(result);
  }

  static fromQueryResults(results: {
    id: string;
    cedula: string;
    names: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    createdAt: Date;
  }[]): CustomerListResponseDto[] {
    return results.map((r) => CustomerListResponseDto.fromQueryResult(r));
  }
}