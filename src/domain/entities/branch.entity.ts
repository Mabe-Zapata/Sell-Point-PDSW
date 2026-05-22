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
