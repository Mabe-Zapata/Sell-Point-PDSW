import { Repository } from 'typeorm';
import {
  IdempotencyEntryStatus,
  IdempotencyEntryTypeOrmEntity,
} from '../database/entities/idempotency-entry.typeorm.entity';
import { IdempotencyService } from './idempotency.service';

describe('IdempotencyService', () => {
  let repo: jest.Mocked<Partial<Repository<IdempotencyEntryTypeOrmEntity>>>;
  let service: IdempotencyService;

  beforeEach(() => {
    repo = {
      insert: jest.fn().mockResolvedValue({}),
      create: jest.fn((entry) => entry as IdempotencyEntryTypeOrmEntity),
      findOne: jest.fn(),
      save: jest.fn(async (entry) => entry),
      remove: jest.fn(),
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    service = new IdempotencyService(repo as Repository<IdempotencyEntryTypeOrmEntity>);
  });

  it('starts a new idempotency entry', async () => {
    const result = await service.begin('key-1', 'hash-1');

    expect(result).toEqual({ status: 'STARTED' });
    expect(repo.insert).toHaveBeenCalledWith(expect.objectContaining({
      key: 'key-1',
      requestHash: 'hash-1',
      status: IdempotencyEntryStatus.IN_PROGRESS,
    }));
  });

  it('returns the stored response for completed duplicate requests with the same hash', async () => {
    repo.insert = jest.fn().mockRejectedValue({ code: '23505' });
    repo.findOne = jest.fn().mockResolvedValue({
      key: 'key-1',
      requestHash: 'hash-1',
      status: IdempotencyEntryStatus.COMPLETED,
      response: JSON.stringify({ id: 'sale-1' }),
      createdAt: new Date(),
    });

    const result = await service.begin('key-1', 'hash-1');

    expect(result).toEqual({ status: 'COMPLETED', response: { id: 'sale-1' } });
  });

  it('rejects duplicate keys with different request hashes', async () => {
    repo.insert = jest.fn().mockRejectedValue({ code: '23505' });
    repo.findOne = jest.fn().mockResolvedValue({
      key: 'key-1',
      requestHash: 'hash-1',
      status: IdempotencyEntryStatus.COMPLETED,
      response: JSON.stringify({ id: 'sale-1' }),
      createdAt: new Date(),
    });

    const result = await service.begin('key-1', 'hash-2');

    expect(result).toEqual({ status: 'PAYLOAD_MISMATCH' });
  });

  it('reports in-progress duplicate requests', async () => {
    repo.insert = jest.fn().mockRejectedValue({ code: '23505' });
    repo.findOne = jest.fn().mockResolvedValue({
      key: 'key-1',
      requestHash: 'hash-1',
      status: IdempotencyEntryStatus.IN_PROGRESS,
      createdAt: new Date(),
    });

    const result = await service.begin('key-1', 'hash-1');

    expect(result).toEqual({ status: 'IN_PROGRESS' });
  });

  it('allows retry after a failed request with the same hash', async () => {
    const failedEntry = {
      key: 'key-1',
      requestHash: 'hash-1',
      status: IdempotencyEntryStatus.FAILED,
      createdAt: new Date(),
    };
    repo.insert = jest.fn().mockRejectedValue({ code: '23505' });
    repo.findOne = jest.fn().mockResolvedValue(failedEntry);

    const result = await service.begin('key-1', 'hash-1');

    expect(result).toEqual({ status: 'STARTED' });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
      status: IdempotencyEntryStatus.IN_PROGRESS,
      requestHash: 'hash-1',
    }));
  });

  it('marks a key as completed with serialized response', async () => {
    const entry = {
      key: 'key-1',
      requestHash: 'hash-1',
      status: IdempotencyEntryStatus.IN_PROGRESS,
      createdAt: new Date(),
    };
    repo.findOne = jest.fn().mockResolvedValue(entry);

    await service.complete('key-1', { id: 'sale-1' });

    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
      status: IdempotencyEntryStatus.COMPLETED,
      response: JSON.stringify({ id: 'sale-1' }),
    }));
  });

  it('marks a key as failed', async () => {
    const entry = {
      key: 'key-1',
      requestHash: 'hash-1',
      status: IdempotencyEntryStatus.IN_PROGRESS,
      response: JSON.stringify({ id: 'sale-1' }),
      createdAt: new Date(),
    };
    repo.findOne = jest.fn().mockResolvedValue(entry);

    await service.fail('key-1');

    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
      status: IdempotencyEntryStatus.FAILED,
      response: undefined,
    }));
  });
});
