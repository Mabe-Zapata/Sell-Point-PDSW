import {
  Controller,
  Get,
  Body,
  Put,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UpdateUserCommand } from '../../application/cqrs/user/commands/update-user/update-user.command';
import { ActivateUserCommand } from '../../application/cqrs/user/commands/activate-user/activate-user.command';
import { DeactivateUserCommand } from '../../application/cqrs/user/commands/deactivate-user/deactivate-user.command';
import { GetUserQuery } from '../../application/cqrs/user/queries/get-user/get-user.query';
import { ListUsersQuery } from '../../application/cqrs/user/queries/list-users/list-users.query';

import { UpdateUserDto } from '../../application/dto/user/update-user.dto';
import { UserResponseDto } from '../../application/dto/user/user-response.dto';
import { PaginationParams } from '../../domain/repositories/pagination.types';
import { UserFilters } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { PaginatedResult } from '../../domain/repositories/pagination.types';
import { Roles } from '../decorators/roles.decorator';
import { AuthService } from '../../infrastructure/services/auth.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Roles('ADMIN')
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios (solo ADMIN)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'createdFrom', description: 'Filter by creation date from (ISO 8601)', required: false, type: String })
  @ApiQuery({ name: 'createdTo', description: 'Filter by creation date to (ISO 8601)', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de usuarios', type: UserResponseDto, isArray: true })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('createdFrom') createdFrom?: string,
    @Query('createdTo') createdTo?: string,
  ): Promise<{ data: UserResponseDto[]; total: number; page: number; limit: number }> {
    const pagination: PaginationParams = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const filters: UserFilters = {
      q,
      role,
      status,
      createdFrom: createdFrom ? new Date(createdFrom) : undefined,
      createdTo: createdTo ? new Date(createdTo) : undefined,
    };

    const result = await this.queryBus.execute<ListUsersQuery, PaginatedResult<User>>(
      new ListUsersQuery(pagination, filters),
    );

    return {
      data: UserResponseDto.fromEntities(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Obtener KPIs de usuarios (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'KPIs de usuarios', schema: { type: 'object' } })
  async getKpis(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    blockedEmployees: number;
  }> {
    const [total, active, inactive, blocked] = await Promise.all([
      this.authService.listUsers({ page: 1, limit: 1 }, {}),
      this.authService.listUsers({ page: 1, limit: 1 }, { status: 'ACTIVE' }),
      this.authService.listUsers({ page: 1, limit: 1 }, { status: 'INACTIVE' }),
      this.authService.listUsers({ page: 1, limit: 1 }, { status: 'BLOCKED' }),
    ]);

    return {
      totalEmployees: total.total,
      activeEmployees: active.total,
      inactiveEmployees: inactive.total,
      blockedEmployees: blocked.total,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.queryBus.execute<GetUserQuery, User>(new GetUserQuery(id));
    return UserResponseDto.fromEntity(user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar usuario (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Usuario actualizado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.commandBus.execute<UpdateUserCommand, User>(new UpdateUserCommand(id, dto));
    return UserResponseDto.fromEntity(user);
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar usuario (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario activado', type: UserResponseDto })
  async activate(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.commandBus.execute<ActivateUserCommand, User>(new ActivateUserCommand(id));
    return UserResponseDto.fromEntity(user);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desactivar usuario (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado', type: UserResponseDto })
  async deactivate(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.commandBus.execute<DeactivateUserCommand, User>(new DeactivateUserCommand(id));
    return UserResponseDto.fromEntity(user);
  }
}
