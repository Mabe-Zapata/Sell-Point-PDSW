import { UnlockUserHandler } from './unlock-user.handler';
import { UnlockUserCommand } from './unlock-user.command';

describe('UnlockUserHandler (application layer)', () => {
  let mockRepository: any;
  let handler: UnlockUserHandler;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      updateFailedLoginAttempts: jest.fn(),
      update: jest.fn(),
    };

    handler = new UnlockUserHandler(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('resets failedLoginAttempts to 0 when unlocking a blocked user', async () => {
    const user = {
      id: 'user-locked',
      unlock: jest.fn(),
    };

    mockRepository.findById.mockResolvedValue(user);

    await handler.execute(new UnlockUserCommand('user-locked'));

    expect(user.unlock).toHaveBeenCalledTimes(1);
    expect(mockRepository.updateFailedLoginAttempts).toHaveBeenCalledWith('user-locked', 0);
    expect(mockRepository.update).toHaveBeenCalledWith(user);
  });
});
