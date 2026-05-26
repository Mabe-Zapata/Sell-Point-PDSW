export class PasswordResetToken {
  readonly id!: string;
  readonly userId!: string;
  readonly tokenHash!: string;
  readonly expiresAt!: Date;
  readonly usedAt!: Date | null;
  readonly createdAt!: Date;
  readonly requestIp?: string;
  readonly requestUserAgent?: string;

  constructor(properties: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt?: Date | null;
    createdAt?: Date;
    requestIp?: string;
    requestUserAgent?: string;
  }) {
    this.id = properties.id;
    this.userId = properties.userId;
    this.tokenHash = properties.tokenHash;
    this.expiresAt = properties.expiresAt;
    this.usedAt = properties.usedAt ?? null;
    this.createdAt = properties.createdAt || new Date();
    this.requestIp = properties.requestIp;
    this.requestUserAgent = properties.requestUserAgent;
  }

  isValid(): boolean {
    if (this.usedAt !== null) {
      return false;
    }
    return this.expiresAt > new Date();
  }
}
