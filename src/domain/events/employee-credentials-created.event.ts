export class EmployeeCredentialsCreatedEvent {
  constructor(
    public readonly employeeId: string,
    public readonly username: string,
    public readonly email: string,
    public readonly temporaryPassword: string,
    public readonly firstName: string,
  ) {}
}