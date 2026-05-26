export class RequestPasswordResetCommand {
  constructor(
    public readonly email: string,
    public readonly ip?: string,
    public readonly userAgent?: string,
  ) {}
}
