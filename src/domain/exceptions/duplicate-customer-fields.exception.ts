import { DuplicateUserFieldsException, type DuplicateUserFieldErrors } from './duplicate-user-fields.exception';

export class DuplicateCustomerFieldsException extends DuplicateUserFieldsException {
  constructor(errors: DuplicateUserFieldErrors) {
    super(errors);
    this.name = 'DuplicateCustomerFieldsException';
  }
}
