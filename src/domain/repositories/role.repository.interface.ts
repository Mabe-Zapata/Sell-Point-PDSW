import { Role } from '../entities';

export interface IRoleRepository {
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  create(role: Role): Promise<Role>;
   update(role: Role): Promise<Role>;
}