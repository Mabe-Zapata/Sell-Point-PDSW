import { CreateRoleDto } from '../../../../dto/role/create-role.dto';

export class CreateRoleCommand {
  constructor(public readonly payload: CreateRoleDto) {}
}