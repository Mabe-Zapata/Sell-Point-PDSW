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
