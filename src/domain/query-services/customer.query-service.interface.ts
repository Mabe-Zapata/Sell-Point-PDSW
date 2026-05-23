import { Customer } from '../entities';

// identificationType/identificationNumber replaced by cedula (simplify-schema-uta SDD)
export interface CustomerListItem {
  id: string;
  cedula: string;
  names: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
}

export interface ICustomerQueryService {
  listCustomers(params: {
    page: number;
    limit: number;
    q?: string;
    cedula?: string;
  }): Promise<{ data: CustomerListItem[]; total: number; page: number; limit: number }>;
  getCustomerByIdentification(cedula: string): Promise<Customer | null>;
}