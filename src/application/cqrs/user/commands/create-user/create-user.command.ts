import { CreateUserDto } from '../../../../dto/user/create-user.dto';

export class CreateUserCommand {
  constructor(public readonly payload: CreateUserDto) {}
}