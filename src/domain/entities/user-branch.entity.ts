export class UserBranch {
  userId!: string;

  branchId!: string;

  createdAt!: Date;

  constructor(partial: Partial<UserBranch>) {
    Object.assign(this, partial);
  }
}
