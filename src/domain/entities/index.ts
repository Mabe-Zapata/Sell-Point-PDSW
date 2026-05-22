import { UserStatus } from './enums/user-status.enum';

export class Role {
  id!: string;
  name!: string;
  description?: string;
  createdAt!: Date;

  constructor(partial: Partial<Role>) {
    Object.assign(this, partial);
  }
}

export class User {
  id!: string;
  username!: string;
  passwordHash!: string;
  email?: string;
  status!: UserStatus;
  defaultBranchId?: string | null;
  failedLoginAttempts!: number;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}

export class UserRole {
  userId!: string;
  roleId!: string;
  createdAt!: Date;

  constructor(partial: Partial<UserRole>) {
    Object.assign(this, partial);
  }
}

export class UserBranch {
  userId!: string;
  branchId!: string;
  createdAt!: Date;

  constructor(partial: Partial<UserBranch>) {
    Object.assign(this, partial);
  }
}

export class ErrorLog {
  id!: string;
  exceptionType!: string;
  message!: string;
  stackTrace?: string;
  source?: string;
  userId?: string | null;
  createdAt!: Date;

  constructor(partial: Partial<ErrorLog>) {
    Object.assign(this, partial);
  }
}

export class Branch {
  id!: string;
  name!: string;
  city?: string;
  address?: string;
  phone?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Branch>) {
    Object.assign(this, partial);
  }
}

export class Warehouse {
  id!: string;
  branchId!: string;
  name!: string;
  isMain!: boolean;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Warehouse>) {
    Object.assign(this, partial);
  }
}

export class Category {
  id!: string;
  name!: string;
  description?: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Category>) {
    Object.assign(this, partial);
  }
}

export class Product {
  id!: string;
  categoryId!: string;
  code!: string;
  name!: string;
  salePrice!: number;
  costPrice!: number;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Product>) {
    Object.assign(this, partial);
  }
}

export class TaxRate {
  id!: string;
  name!: string;
  percentage!: number;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<TaxRate>) {
    Object.assign(this, partial);
  }
}

export class Inventory {
  id!: string;
  warehouseId!: string;
  productId!: string;
  currentStock!: number;
  minimumStock!: number;
  maximumStock!: number;
  updatedAt!: Date;

  constructor(partial: Partial<Inventory>) {
    Object.assign(this, partial);
  }
}

export class StockMovement {
  id!: string;
  warehouseId!: string;
  productId!: string;
  type!: string;
  quantity!: number;
  stockBefore!: number;
  stockAfter!: number;
  userId?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  createdAt!: Date;

  constructor(partial: Partial<StockMovement>) {
    Object.assign(this, partial);
  }
}

export class StockTransfer {
  id!: string;
  fromBranchId!: string;
  toBranchId!: string;
  requesterUserId!: string;
  approverUserId?: string | null;
  status!: string;
  notes?: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<StockTransfer>) {
    Object.assign(this, partial);
  }
}

export class StockTransferDetail {
  id!: string;
  stockTransferId!: string;
  productId!: string;
  quantity!: number;
  createdAt!: Date;

  constructor(partial: Partial<StockTransferDetail>) {
    Object.assign(this, partial);
  }
}

export class Sale {
  id!: string;
  branchId!: string;
  customerId!: string;
  cashierUserId!: string;
  taxRateId!: string;
  saleNumber!: string;
  status!: string;
  subtotal!: number;
  taxAmount!: number;
  discountAmount!: number;
  total!: number;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Sale>) {
    Object.assign(this, partial);
  }
}

export class SaleDetail {
  id!: string;
  saleId!: string;
  productId!: string;
  productName!: string;
  productCode!: string;
  quantity!: number;
  unitPrice!: number;
  createdAt!: Date;

  constructor(partial: Partial<SaleDetail>) {
    Object.assign(this, partial);
  }
}

export class SalesHistory {
  id!: string;
  saleId!: string;
  originalCreatedAt!: Date;
  movedAt!: Date;

  constructor(partial: Partial<SalesHistory>) {
    Object.assign(this, partial);
  }
}

export class Payment {
  id!: string;
  saleId!: string;
  method!: string;
  amount!: number;
  reference?: string | null;
  paidAt!: Date;
  createdAt!: Date;

  constructor(partial: Partial<Payment>) {
    Object.assign(this, partial);
  }
}

export class InvoiceSeries {
  id!: string;
  branchId!: string;
  establishmentCode!: string;
  emissionPointCode!: string;
  currentSequence!: number;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<InvoiceSeries>) {
    Object.assign(this, partial);
  }
}

export class Invoice {
  id!: string;
  saleId!: string;
  seriesId!: string;
  invoiceNumber!: string;
  authorizationNumber?: string;
  issueDate!: Date;
  status!: string;
  cancelledAt?: Date | null;
  createdAt!: Date;

  constructor(partial: Partial<Invoice>) {
    Object.assign(this, partial);
  }
}

export class Customer {
  id!: string;
  identificationType!: string;
  identificationNumber!: string;
  names!: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Customer>) {
    Object.assign(this, partial);
  }
}
