/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, HttpCode, HttpStatus, Post, Req, UnauthorizedException, Get, Query, Param } from '@nestjs/common';
import { ApiBody, ApiBearerAuth, ApiOperation, ApiTags, ApiProperty, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CommandBus } from '@nestjs/cqrs';
import { AuthService } from '../../infrastructure/services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { AuthMeResponseDto } from '../../application/dto/auth/auth-me-response.dto';
import { UserListResponseDto } from '../../application/dto/user/user-list-response.dto';
import { PaginationParams } from '../../domain/repositories/pagination.types';
import { RegisterEmployeeDto } from '../../application/dto/auth/register-employee.dto';
import { RequestPasswordResetDto } from '../../application/dto/auth/request-password-reset.dto';
import { ResetPasswordDto } from '../../application/dto/auth/reset-password.dto';
import { RegisterEmployeeCommand } from '../../application/cqrs/auth/commands/register-employee/register-employee.command';
import { RequestPasswordResetCommand } from '../../application/cqrs/auth/commands/request-password-reset/request-password-reset.command';
import { ResetPasswordCommand } from '../../application/cqrs/auth/commands/reset-password/reset-password.command';
import { RegisterEmployeeValidator } from '../../application/cqrs/auth/handlers/register-employee/register-employee.validator';
import { RequestPasswordResetValidator } from '../../application/cqrs/auth/handlers/request-password-reset/request-password-reset.validator';
import { ResetPasswordValidator } from '../../application/cqrs/auth/handlers/reset-password/reset-password.validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Opaque refresh token returned by /auth/login',
    example: 'b2c4f9c1-1111-2222-3333-444455556666',
    required: false,
  })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly commandBus: CommandBus,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  async login(@Body() dto: LoginDto) {
    const tokens = await this.authService.login(dto.email, dto.password, dto.rememberMe);
    if (!tokens) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'auth.errors.invalid_credentials',
      });
    }
    return tokens;
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RefreshTokenDto })
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const refreshToken = dto.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'auth.errors.invalid_credentials',
      });
    }

    const payload = await this.authService.validateRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'auth.errors.invalid_credentials',
      });
    }

    const accessToken = this.authService.generateAccessToken(payload);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  async me(@Req() req: { user?: { employeeId: string } }): Promise<AuthMeResponseDto> {
    const user = await this.authService.getAuthenticatedUser(req.user?.employeeId ?? '');
    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'auth.errors.invalid_credentials',
      });
    }
    return AuthMeResponseDto.fromEntity(user);
  }

  @Post('unlock/:id')
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock a blocked user (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID to unlock' })
  @ApiResponse({ status: 200, description: 'User unlocked successfully' })
  async unlockUser(@Param('id') id: string): Promise<{ message: string }> {
    await this.authService.unlockUser(id);
    return { message: 'User unlocked successfully' };
  }

  @Get('users')
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List users (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search by employeeId, username or email' })
  @ApiQuery({ name: 'employeeId', required: false, type: String })
  @ApiQuery({ name: 'username', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully', type: UserListResponseDto, isArray: true })
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('employeeId') employeeId?: string,
    @Query('username') username?: string,
    @Query('email') email?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('isActive') isActive?: string,
  ): Promise<{ data: UserListResponseDto[]; total: number; page: number; limit: number }> {
    const pagination: PaginationParams = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const result = await this.authService.listUsers(pagination, {
      q,
      employeeId,
      username,
      email,
      role,
      status,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });

    return {
      data: UserListResponseDto.fromEntities(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Post('register')
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new employee (admin only)' })
  @ApiResponse({ status: 201, description: 'Employee registered successfully' })
  async registerEmployee(@Body() dto: RegisterEmployeeDto) {
    RegisterEmployeeValidator.validate(dto);
    const command = new RegisterEmployeeCommand(dto.email, dto.firstName, dto.lastName, dto.role);
    const result = await this.commandBus.execute(command);
    return result;
  }

  @Post('password-reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if account exists' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    RequestPasswordResetValidator.validate(dto);
    const command = new RequestPasswordResetCommand(dto.email);
    const result = await this.commandBus.execute(command);
    return result;
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with a valid token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    ResetPasswordValidator.validate(dto);
    const command = new ResetPasswordCommand(dto.token, dto.newPassword, dto.confirmPassword);
    const result = await this.commandBus.execute(command);
    return result;
  }
}