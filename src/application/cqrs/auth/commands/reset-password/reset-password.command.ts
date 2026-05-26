export class ResetPasswordCommand {
  constructor(
    public readonly token: string,
    public readonly newPassword: string,
    public readonly confirmPassword: string,
    public readonly ip?: string,
    public readonly userAgent?: string,
  ) {}
}
