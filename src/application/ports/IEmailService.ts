export type PasswordResetData = {
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
};

export type InvoiceItemData = {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerCedula?: string;
  items: InvoiceItemData[];
  total: number;
  seriesNumber?: string;
};

export type EmployeeCredentialsData = {
  firstName: string;
  username: string;
  temporaryPassword: string;
  loginUrl: string;
};

export type PasswordChangeData = {
  firstName: string;
  changedAt: string;
  ip?: string;
  userAgent?: string;
  location?: string;
  requestedIp?: string;
  requestedUserAgent?: string;
  requestedLocation?: string;
};

export type SendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

export interface IEmailService {
  sendPasswordReset(to: string, data: PasswordResetData): Promise<SendResult>;
  sendInvoice(to: string, invoiceId: string, data: InvoiceData): Promise<SendResult>;
  sendEmployeeCredentials(to: string, data: EmployeeCredentialsData): Promise<SendResult>;
  sendPasswordChangeNotification(to: string, data: PasswordChangeData): Promise<SendResult>;
}
