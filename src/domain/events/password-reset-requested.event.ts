export class PasswordResetRequestedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly token: string,
    public readonly resetUrl: string,
    public readonly expiresAt: Date,
  ) {}
}
