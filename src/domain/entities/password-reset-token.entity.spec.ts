import { PasswordResetToken } from './password-reset-token.entity';

describe('PasswordResetToken', () => {
  describe('constructor', () => {
    it('should assign all fields correctly', () => {
      const now = new Date();
      const token = new PasswordResetToken({
        id: 'test-id',
        userId: 'user-id',
        tokenHash: 'hash-value',
        expiresAt: now,
        usedAt: null,
        createdAt: now,
      });

      expect(token.id).toBe('test-id');
      expect(token.userId).toBe('user-id');
      expect(token.tokenHash).toBe('hash-value');
      expect(token.expiresAt).toBe(now);
      expect(token.usedAt).toBeNull();
      expect(token.createdAt).toBe(now);
    });

    it('should default usedAt to null when not provided', () => {
      const now = new Date();
      const token = new PasswordResetToken({
        id: 'test-id',
        userId: 'user-id',
        tokenHash: 'hash-value',
        expiresAt: now,
      });

      expect(token.usedAt).toBeNull();
    });

    it('should default createdAt to new Date() when not provided', () => {
      const before = new Date();
      const token = new PasswordResetToken({
        id: 'test-id',
        userId: 'user-id',
        tokenHash: 'hash-value',
        expiresAt: new Date(),
      });
      const after = new Date();

      expect(token.createdAt >= before && token.createdAt <= after).toBe(true);
    });
  });

  describe('isValid', () => {
    it('should return true when token is valid (not expired, not used)', () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      const token = new PasswordResetToken({
        id: 'test-id',
        userId: 'user-id',
        tokenHash: 'hash-value',
        expiresAt: futureDate,
        usedAt: null,
      });

      expect(token.isValid()).toBe(true);
    });

    it('should return false when token is expired', () => {
      const pastDate = new Date(Date.now() - 1); // 1ms ago
      const token = new PasswordResetToken({
        id: 'test-id',
        userId: 'user-id',
        tokenHash: 'hash-value',
        expiresAt: pastDate,
        usedAt: null,
      });

      expect(token.isValid()).toBe(false);
    });

    it('should return false when token is already used', () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000);
      const token = new PasswordResetToken({
        id: 'test-id',
        userId: 'user-id',
        tokenHash: 'hash-value',
        expiresAt: futureDate,
        usedAt: new Date(),
      });

      expect(token.isValid()).toBe(false);
    });

    it('should return false when token is both expired and used', () => {
      const pastDate = new Date(Date.now() - 1);
      const token = new PasswordResetToken({
        id: 'test-id',
        userId: 'user-id',
        tokenHash: 'hash-value',
        expiresAt: pastDate,
        usedAt: new Date(),
      });

      expect(token.isValid()).toBe(false);
    });
  });
});
