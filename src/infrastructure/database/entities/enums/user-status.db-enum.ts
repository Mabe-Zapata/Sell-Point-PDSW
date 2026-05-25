export enum UserStatusDb {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

import { UserStatus } from '../../../../domain/entities/enums/user-status.enum';

export class UserStatusMapper {
  static toDomain(value: string | UserStatusDb): UserStatus {
    return UserStatus[value as keyof typeof UserStatus];
  }

  static toDb(domain: UserStatus): string {
    return domain;
  }
}
