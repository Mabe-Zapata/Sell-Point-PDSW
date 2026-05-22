import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserTypeOrmEntity } from './user.typeorm.entity';
import { RoleTypeOrmEntity } from './role.typeorm.entity';

@Entity('USER_ROLES')
export class UserRoleTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'USR_ID', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'USR_ID' })
  user!: UserTypeOrmEntity;

  @Column({ name: 'ROL_ID', type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => RoleTypeOrmEntity)
  @JoinColumn({ name: 'ROL_ID' })
  role!: RoleTypeOrmEntity;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;
}