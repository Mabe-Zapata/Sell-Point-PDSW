export class CustomerListResponseDto {
  id: string;
  identificationType: string;
  identificationNumber: string;
  names: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;

  constructor(data: {
    id: string;
    identificationType: string;
    identificationNumber: string;
    names: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    createdAt: Date;
  }) {
    this.id = data.id;
    this.identificationType = data.identificationType;
    this.identificationNumber = data.identificationNumber;
    this.names = data.names;
    this.email = data.email;
    this.phone = data.phone;
    this.address = data.address;
    this.createdAt = data.createdAt;
  }

  static fromQueryResult(result: {
    id: string;
    identificationType: string;
    identificationNumber: string;
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
    identificationType: string;
    identificationNumber: string;
    names: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    createdAt: Date;
  }[]): CustomerListResponseDto[] {
    return results.map((r) => CustomerListResponseDto.fromQueryResult(r));
  }
}