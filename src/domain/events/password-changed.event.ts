export class PasswordChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly changedAt: Date,
    public readonly ip?: string,
    public readonly userAgent?: string,
    public readonly resetRequestedIp?: string,
    public readonly resetRequestedUserAgent?: string,
  ) {}
}