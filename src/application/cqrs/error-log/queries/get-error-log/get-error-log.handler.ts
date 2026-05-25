import { GetErrorLogQuery } from './get-error-log.query';
import { ERROR_LOG_REPOSITORY } from '../../../../tokens';
import type { IErrorLogRepository } from '../../../../../domain/repositories';
import { ErrorLog } from '../../../../../domain/entities';
export class GetErrorLogHandler {
  constructor(
    protected readonly errorLogRepository: IErrorLogRepository,
  ) {}

  async execute(query: GetErrorLogQuery): Promise<ErrorLog | null> {
    return this.errorLogRepository.findById(query.id);
  }
}
