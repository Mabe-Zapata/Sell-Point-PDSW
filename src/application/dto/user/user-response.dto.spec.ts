import { UserResponseDto } from './user-response.dto';
import { User } from '../../../domain/entities/user.entity';
import { UserStatus } from '../../../domain/entities/enums';

describe('UserResponseDto', () => {
  it('maps failedLoginAttempts from the entity', () => {
    const user = new User({
      id: 'user-1',
      employeeId: 'EMP-1',
      username: 'jdoe',
      email: 'jdoe@test.com',
      passwordHash: 'hash',
      role: 'ADMIN',
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 3,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    const dto = UserResponseDto.fromEntity(user);

    expect(dto.failedLoginAttempts).toBe(3);
  });
});
