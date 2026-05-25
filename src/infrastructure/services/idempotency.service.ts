import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly processedRequests = new Map<string, { response: unknown; timestamp: number }>();
  private readonly TTL_MS = 3600000; // 1 hora

  constructor(private readonly configService: ConfigService) {}

  /**
   * Verifica si un request ya fue procesado.
   * Si existe, devuelve la respuesta previa.
   * Si no, marca como procesado y devuelve null.
   */
  async checkAndMark(key: string): Promise<{ isDuplicate: boolean; previousResponse?: unknown }> {
    const existing = this.processedRequests.get(key);

    if (existing) {
      const isExpired = Date.now() - existing.timestamp > this.TTL_MS;
      
      if (isExpired) {
        this.processedRequests.delete(key);
        this.logger.log(`Idempotency key expired: ${key}`);
        return { isDuplicate: false };
      }

      this.logger.log(`Duplicate request detected: ${key}`);
      return { isDuplicate: true, previousResponse: existing.response };
    }

    this.processedRequests.set(key, { response: null, timestamp: Date.now() });
    return { isDuplicate: false };
  }

  /**
   * Guarda la respuesta para un request procesado.
   */
  async saveResponse(key: string, response: unknown): Promise<void> {
    const existing = this.processedRequests.get(key);
    
    if (existing) {
      existing.response = response;
      this.logger.log(`Idempotency response saved: ${key}`);
    }
  }

  /**
   * Limpia entradas expiradas (para evitar memory leaks)
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.processedRequests.entries()) {
      if (now - entry.timestamp > this.TTL_MS) {
        this.processedRequests.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned ${cleaned} expired idempotency entries`);
    }
  }
}