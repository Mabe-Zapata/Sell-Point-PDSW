import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PasswordResetTokenRepository } from './password-reset-token.repository';
import { PasswordResetTokenTypeOrmEntity } from '../database/entities/password-reset-token.typeorm.entity';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';

describe('PasswordResetTokenRepository', () => {
  let repository: PasswordResetTokenRepository;
  let mockRepo: Partial<Repository<PasswordResetTokenTypeOrmEntity>>;
  let mockDataSource: Partial<DataSource>;

  const mockToken: PasswordResetToken = new PasswordResetToken({
    id: 'test-id',
    userId: 'user-id',
    tokenHash: 'bcrypt-hash',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    usedAt: null,
    createdAt: new Date(),
  });

  const mockEntity: PasswordResetTokenTypeOrmEntity = {
    id: 'test-id',
    userId: 'user-id',
    tokenHash: 'bcrypt-hash',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    usedAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...mockEntity, ...entity })),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    mockDataSource = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetTokenRepository,
        { provide: getRepositoryToken(PasswordResetTokenTypeOrmEntity), useValue: mockRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    repository = module.get<PasswordResetTokenRepository>(PasswordResetTokenRepository);
  });

  describe('create', () => {
    it('should persist token and return with id', async () => {
      const result = await repository.create(mockToken);

      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('test-id');
      expect(result.userId).toBe('user-id');
      expect(result.tokenHash).toBe('bcrypt-hash');
    });
  });

  describe('findByHash', () => {
    it('should return token when found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(mockEntity);

      const result = await repository.findByHash('bcrypt-hash');

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { tokenHash: 'bcrypt-hash' } });
      expect(result).not.toBeNull();
      expect(result?.tokenHash).toBe('bcrypt-hash');
    });

    it('should return null when not found', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByHash('nonexistent-hash');

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { tokenHash: 'nonexistent-hash' } });
      expect(result).toBeNull();
    });
  });

  describe('markAsUsed', () => {
    it('should update used_at to current timestamp', async () => {
      (mockRepo.update as jest.Mock).mockResolvedValue({ affected: 1 });

      await repository.markAsUsed('test-id');

      expect(mockRepo.update).toHaveBeenCalledWith('test-id', { usedAt: expect.any(Date) });
    });
  });
});
