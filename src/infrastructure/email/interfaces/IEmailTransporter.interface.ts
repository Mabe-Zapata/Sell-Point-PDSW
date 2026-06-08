export interface Attachment {
  filename: string;
  content: Buffer;
  mimetype: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailTransporter {
  send(to: string, subject: string, htmlContent: string, attachments?: Attachment[]): Promise<SendResult>;
}
