export class EmailAlreadyExistsException extends Error {
  constructor(email: string) {
    super(`The email ${email} is already registered in the system.`);
    this.name = 'EmailAlreadyExistsException';
  }
}
