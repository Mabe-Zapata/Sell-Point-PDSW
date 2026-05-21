/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { AuthService } from '../../infrastructure/services/auth.service';
import { LoginDto } from '../dto/login.dto';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with employee code and password' })
  async login(@Body() dto: LoginDto) {
    const tokens = await this.authService.login(dto.employeeCode, dto.password, dto.rememberMe);
    if (!tokens) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'auth.errors.invalid_credentials',
      });
    }
    return tokens;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const payload = await this.authService.validateRefreshToken(dto.refreshToken);
    if (!payload) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'auth.errors.invalid_credentials',
      });
    }

    await this.authService.revokeRefreshToken(dto.refreshToken);

    const accessToken = this.authService.generateAccessToken(payload);
    const newRefreshToken = await this.authService.generateRefreshToken(payload, false);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    };
  }
}
