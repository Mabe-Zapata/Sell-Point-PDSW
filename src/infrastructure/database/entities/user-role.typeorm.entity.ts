import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { UserTypeOrmEntity } from './user.typeorm.entity';
import { RoleTypeOrmEntity } from './role.typeorm.entity';

@Entity('USER_ROLES')
@Index('UX_USER_ROLES_USR_ID', ['userId'], { unique: true })
export class UserRoleTypeOrmEntity {
  @PrimaryColumn({ name: 'USR_ID', type: 'uuid' })
  userId!: string;

  @OneToOne(() => UserTypeOrmEntity, (user) => user.userRole)
  @JoinColumn({ name: 'USR_ID' })
  user!: UserTypeOrmEntity;

  @Column({ name: 'ROL_ID', type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => RoleTypeOrmEntity, { eager: true })
  @JoinColumn({ name: 'ROL_ID' })
  role!: RoleTypeOrmEntity;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;
}
