export class RegisterEmployeeCommand {
  constructor(
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly role: string,
    public readonly cedula?: string,
    public readonly username?: string,
    public readonly defaultBranchId?: string,
  ) {}
}
