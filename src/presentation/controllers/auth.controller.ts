/* eslint-disable @typescript-eslint/no-unsafe-return */
 
 
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException, Get, Query, Param, Headers, UseGuards, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiBody, ApiBearerAuth, ApiOperation, ApiTags, ApiProperty, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CommandBus } from '@nestjs/cqrs';
import { AuthService } from '../../infrastructure/services/auth.service';
import { CookieService } from '../../infrastructure/services/cookie.service';
import { LoginDto } from '../dto/login.dto';
import { LinkGoogleDto } from '../dto/auth/google-link.dto';
import { LoginGoogleDto } from '../dto/auth/google-login.dto';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { AuthMeResponseDto } from '../../application/dto/auth/auth-me-response.dto';
import { UserListResponseDto } from '../../application/dto/user/user-list-response.dto';
import { PaginationParams } from '../../domain/repositories/pagination.types';
import { PaginationQueryDto } from '../dto/pagination/pagination-query.dto';
import { RegisterEmployeeDto } from '../../application/dto/auth/register-employee.dto';
import { RequestPasswordResetDto } from '../../application/dto/auth/request-password-reset.dto';
import { ResetPasswordDto } from '../../application/dto/auth/reset-password.dto';
import { RegisterEmployeeCommand } from '../../application/cqrs/auth/commands/register-employee/register-employee.command';
import { RequestPasswordResetCommand } from '../../application/cqrs/auth/commands/request-password-reset/request-password-reset.command';
import { ResetPasswordCommand } from '../../application/cqrs/auth/commands/reset-password/reset-password.command';
import { RegisterEmployeeValidator } from '../../application/cqrs/auth/handlers/register-employee/register-employee.validator';
import { RequestPasswordResetValidator } from '../../application/cqrs/auth/handlers/request-password-reset/request-password-reset.validator';
import { ResetPasswordValidator } from '../../application/cqrs/auth/handlers/reset-password/reset-password.validator';
import { resolvePublicIpv4 } from '../../infrastructure/http/request-ip.util';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoginThrottlerGuard } from '../guards/login-throttler.guard';
import type { Request, Response } from 'express';
import { Inject } from '@nestjs/common';
import { PasswordResetTokenRepository } from '../../infrastructure/repositories/password-reset-token.repository';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../infrastructure/common/injection-tokens';

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
    private readonly cookieService: CookieService,
    private readonly commandBus: CommandBus,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY) private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
  ) {}

  @Post('login')
  @Public()
  @UseGuards(LoginThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(dto.email, dto.password, dto.rememberMe);
    if (!tokens) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'auth.errors.invalid_credentials',
      });
    }
    this.cookieService.setRefreshTokenCookie(res, tokens.refreshToken, dto.rememberMe === true);
    return {
      accessToken: tokens.accessToken,
      expiresIn: 900,
    };
  }

  @Post('link-google')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LinkGoogleDto })
  @ApiOperation({ summary: 'Link a Google account to the authenticated user' })
  async linkGoogle(
    @Body() dto: LinkGoogleDto,
    @Req() req: { user?: { employeeId?: string } },
  ): Promise<void> {
    const user = await this.authService.getAuthenticatedUser(req.user?.employeeId ?? '');
    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'auth.errors.invalid_credentials',
      });
    }

    await this.authService.linkGoogle(dto.idToken, user);
  }

  @Delete('link-google')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlink the Google account from the authenticated user' })
  async unlinkGoogle(
    @Req() req: { user?: { employeeId?: string } },
  ): Promise<void> {
    const user = await this.authService.getAuthenticatedUser(req.user?.employeeId ?? '');
    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'auth.errors.invalid_credentials',
      });
    }

    await this.authService.unlinkGoogle(user);
  }

  @Post('login-google')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginGoogleDto })
  @ApiOperation({ summary: 'Authenticate with a Google ID token' })
  async loginGoogle(@Body() dto: LoginGoogleDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.loginGoogle(dto.idToken);
    if (!tokens) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'auth.errors.invalid_credentials',
      });
    }

    this.cookieService.setRefreshTokenCookie(res, tokens.refreshToken, false);

    return {
      accessToken: tokens.accessToken,
      expiresIn: 900,
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using the refreshToken HttpOnly cookie' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldRefreshToken = this.cookieService.readRefreshTokenCookie(req);
    if (!oldRefreshToken) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'auth.errors.invalid_credentials',
      });
    }

    const rotated = await this.authService.rotateRefreshToken(oldRefreshToken);
    if (!rotated) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'auth.errors.invalid_credentials',
      });
    }

    this.cookieService.setRefreshTokenCookie(res, rotated.refreshToken, false);

    return {
      accessToken: rotated.accessToken,
      expiresIn: 900,
    };
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout: revoke refresh token in Redis and clear the HttpOnly cookie (idempotent)' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const token = this.cookieService.readRefreshTokenCookie(req);
    if (token) {
      await this.authService.revokeRefreshToken(token);
    }
    this.cookieService.clearRefreshTokenCookie(res);
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
  async unlockUser(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
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
    @Query() paginationQuery: PaginationQueryDto,
    @Query('q') q?: string,
    @Query('employeeId') employeeId?: string,
    @Query('username') username?: string,
    @Query('email') email?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('isActive') isActive?: string,
  ): Promise<{ data: UserListResponseDto[]; total: number; page: number; limit: number }> {
    const pagination: PaginationParams = {
      page: paginationQuery.page ?? 1,
      limit: paginationQuery.limit ?? 20,
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
    const command = new RegisterEmployeeCommand(
      dto.email,
      dto.firstName,
      dto.lastName,
      dto.role,
      dto.cedula,
      dto.username,
      dto.defaultBranchId,
    );
    const result = await this.commandBus.execute(command);
    return result;
  }

  @Post('password-reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if account exists' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto, @Req() req: Request, @Headers('user-agent') userAgent: string) {
    RequestPasswordResetValidator.validate(dto);
    const command = new RequestPasswordResetCommand(dto.email, await resolvePublicIpv4(req), userAgent);
    const result = await this.commandBus.execute(command);
    return result;
  }


  @Get('reset-password/validate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate whether a password reset token is still usable' })
  @ApiQuery({ name: 'token', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  async validateResetPasswordToken(@Query('token') token: string) {
    if (!token || token.trim().length === 0) {
      return { valid: false, reason: 'invalid' };
    }

    const resetToken = await this.passwordResetTokenRepository.findByRawToken(token.trim());

    if (!resetToken) {
      return { valid: false, reason: 'invalid' };
    }

    if (resetToken.usedAt !== null) {
      return { valid: false, reason: 'used' };
    }

if (resetToken.expiresAt.getTime() <= Date.now()) {
      return { valid: false, reason: 'expired' };
    }

    return { valid: true };
  }
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with a valid token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request, @Headers('user-agent') userAgent: string) {
    ResetPasswordValidator.validate(dto);
    const command = new ResetPasswordCommand(dto.token, dto.newPassword, dto.confirmPassword, await resolvePublicIpv4(req), userAgent);
    const result = await this.commandBus.execute(command);
    return result;
  }
}

