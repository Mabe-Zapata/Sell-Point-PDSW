export class PasswordResetToken {
  readonly id!: string;
  readonly userId!: string;
  readonly tokenHash!: string;
  readonly expiresAt!: Date;
  readonly usedAt!: Date | null;
  readonly createdAt!: Date;

  constructor(properties: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt?: Date | null;
    createdAt?: Date;
  }) {
    this.id = properties.id;
    this.userId = properties.userId;
    this.tokenHash = properties.tokenHash;
    this.expiresAt = properties.expiresAt;
    this.usedAt = properties.usedAt ?? null;
    this.createdAt = properties.createdAt || new Date();
  }

  isValid(): boolean {
    if (this.usedAt !== null) {
      return false;
    }
    return this.expiresAt > new Date();
  }
}
