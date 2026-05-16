/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { AuthService } from '../../infrastructure/services/auth.service';

export class LoginDto {
  @ApiProperty({ example: 'EMP-001' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: 'mypassword' })
  @IsString()
  @IsNotEmpty()
  secret: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate with employee ID and password' })
  async login(@Body() dto: LoginDto) {
    const session = await this.authService.login(dto.identifier, dto.secret);
    if (!session) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return session;
  }
}
