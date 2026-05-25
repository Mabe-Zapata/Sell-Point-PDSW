import { UpdateUserDto } from '../../../../dto/user/update-user.dto';

export class UpdateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly payload: UpdateUserDto,
  ) {}
}