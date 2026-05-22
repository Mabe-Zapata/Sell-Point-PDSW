import { ExceptionType } from './enums';

export class ErrorLog {
  id!: string;

  exceptionType!: ExceptionType;

  message!: string;

  stackTrace?: string;

  source?: string;

  userId?: string;

  createdAt!: Date;

  constructor(partial: Partial<ErrorLog>) {
    Object.assign(this, partial);
  }
}
