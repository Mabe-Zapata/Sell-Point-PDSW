import { ErrorLog } from '../entities';

export interface ErrorLogListItem {
  id: string;
  exceptionType: string;
  message: string;
  source: string;
  userId: string | null;
  userUsername: string | null;
  createdAt: Date;
}

export interface IErrorLogQueryService {
  listErrorLogs(params: {
    page: number;
    limit: number;
    exceptionType?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: ErrorLogListItem[]; total: number; page: number; limit: number }>;
  getErrorLogById(id: string): Promise<ErrorLogListItem | null>;
}