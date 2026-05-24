import { Customer } from '../entities';

export interface CustomerListItem {
  id: string;
  cedula: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
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
