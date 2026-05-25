export class RegisterEmployeeCommand {
  constructor(
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly role: 'EMPLOYEE' | 'CUSTOMER',
  ) {}
}
