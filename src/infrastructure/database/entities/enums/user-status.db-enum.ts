export enum UserStatusDb {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

import { UserStatus } from '../../../../domain/entities/enums/user-status.enum';

export class UserStatusMapper {
  static toDomain(db: UserStatusDb): UserStatus {
    switch (db) {
      case UserStatusDb.ACTIVE:
        return UserStatus.ACTIVE;
      case UserStatusDb.INACTIVE:
        return UserStatus.INACTIVE;
      case UserStatusDb.BLOCKED:
        return UserStatus.BLOCKED;
      default:
        throw new Error(`Unknown UserStatusDb: ${db}`);
    }
  }

  static toDb(domain: UserStatus): UserStatusDb {
    switch (domain) {
      case UserStatus.ACTIVE:
        return UserStatusDb.ACTIVE;
      case UserStatus.INACTIVE:
        return UserStatusDb.INACTIVE;
      case UserStatus.BLOCKED:
        return UserStatusDb.BLOCKED;
      default:
        throw new Error(`Unknown UserStatus: ${domain}`);
    }
  }
}
