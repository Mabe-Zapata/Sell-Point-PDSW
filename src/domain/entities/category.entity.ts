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
