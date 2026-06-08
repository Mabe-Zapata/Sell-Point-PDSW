import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new ThrottlerException('Demasiados intentos de inicio de sesión. Por favor, espera 60 segundos antes de intentarlo de nuevo.');
  }

  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    // Track by IP address for login attempts
    const ip = req['ip'] as string || req['connection']?.['remoteAddress'] as string || 'unknown';
    return ip;
  }
}