import { UpdateRoleDto } from '../../../../dto/role/update-role.dto';

export class UpdateRoleCommand {
  constructor(
    public readonly roleId: string,
    public readonly payload: UpdateRoleDto,
  ) {}
}
