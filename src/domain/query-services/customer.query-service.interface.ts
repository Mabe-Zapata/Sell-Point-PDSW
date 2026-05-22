import { Customer } from '../entities';

export interface CustomerListItem {
  id: string;
  identificationType: string;
  identificationNumber: string;
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
    identificationType?: string;
  }): Promise<{ data: CustomerListItem[]; total: number; page: number; limit: number }>;
  getCustomerByIdentification(identificationNumber: string): Promise<Customer | null>;
}