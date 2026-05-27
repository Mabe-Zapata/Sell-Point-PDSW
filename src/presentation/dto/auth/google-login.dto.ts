import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginGoogleDto {
  @ApiProperty({ example: 'google-id-token' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
