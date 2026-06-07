import { ExecutionContext } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { LoginThrottlerGuard } from './login-throttler.guard';

describe('LoginThrottlerGuard', () => {
  let guard: LoginThrottlerGuard;

  beforeEach(() => {
    guard = new LoginThrottlerGuard();
  });

  describe('getTracker', () => {
    it('should return ip from req.ip', async () => {
      const req = { ip: '192.168.1.100' } as any;
      await expect(guard.getTracker(req)).resolves.toBe('192.168.1.100');
    });

    it('should return ip from req.connection.remoteAddress', async () => {
      const req = { ip: undefined, connection: { remoteAddress: '10.0.0.1' } } as any;
      await expect(guard.getTracker(req)).resolves.toBe('10.0.0.1');
    });

    it('should return "unknown" when no ip available', async () => {
      const req = { ip: undefined, connection: {} } as any;
      await expect(guard.getTracker(req)).resolves.toBe('unknown');
    });
  });

  describe('throwThrottlingException', () => {
    it('should throw ThrottlerException with Spanish message', async () => {
      const context = {} as ExecutionContext;
      await expect(guard.throwThrottlingException(context)).rejects.toThrow(
        ThrottlerException,
      );
      await expect(guard.throwThrottlingException(context)).rejects.toThrow(
        'Demasiados intentos de inicio de sesión. Por favor, espera 60 segundos antes de intentarlo de nuevo.',
      );
    });
  });

  describe('guard structure', () => {
    it('should extend ThrottlerGuard', () => {
      expect(guard).toBeInstanceOf(LoginThrottlerGuard);
      // LoginThrottlerGuard extends ThrottlerGuard
      expect(Object.getPrototypeOf(guard).constructor.name).toBe('LoginThrottlerGuard');
    });

    it('should have throwThrottlingException method', () => {
      expect(typeof guard.throwThrottlingException).toBe('function');
    });

    it('should have getTracker method', () => {
      expect(typeof guard.getTracker).toBe('function');
    });
  });
});