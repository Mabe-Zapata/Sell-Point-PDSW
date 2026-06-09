export class ChangePasswordCommand {
  constructor(
    public readonly userId: string,
    public readonly currentPassword: string,
    public readonly newPassword: string,
    public readonly confirmPassword: string,
    public readonly ip?: string,
    public readonly userAgent?: string,
  ) {}
}
