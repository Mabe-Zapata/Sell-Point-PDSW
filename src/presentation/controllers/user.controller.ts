import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Req,
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

import { CreateUserCommand } from '../../application/cqrs/user/commands/create-user/create-user.command';
import { UpdateUserCommand } from '../../application/cqrs/user/commands/update-user/update-user.command';
import { ActivateUserCommand } from '../../application/cqrs/user/commands/activate-user/activate-user.command';
import { DeactivateUserCommand } from '../../application/cqrs/user/commands/deactivate-user/deactivate-user.command';
import { GetUserQuery } from '../../application/cqrs/user/queries/get-user/get-user.query';
import { ListUsersQuery } from '../../application/cqrs/user/queries/list-users/list-users.query';

import { CreateUserDto } from '../../application/dto/user/create-user.dto';
import { UpdateUserDto } from '../../application/dto/user/update-user.dto';
import { UserResponseDto } from '../../application/dto/user/user-response.dto';
import { PaginationParams } from '../../domain/repositories/pagination.types';
import { UserFilters } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { PaginatedResult } from '../../domain/repositories/pagination.types';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo usuario (solo ADMIN)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuario creado', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  @ApiResponse({ status: 409, description: 'Usuario ya existe' })
  async create(
    @Req() req: { user?: { role?: string } },
    @Body() dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can create users');
    }
    const user = await this.commandBus.execute<CreateUserCommand, User>(new CreateUserCommand(dto));
    return UserResponseDto.fromEntity(user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios (solo ADMIN)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de usuarios', type: UserResponseDto, isArray: true })
  async findAll(
    @Req() req: { user?: { role?: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ): Promise<{ data: UserResponseDto[]; total: number; page: number; limit: number }> {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can list users');
    }

    const pagination: PaginationParams = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const filters: UserFilters = { q, role, status };

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

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(
    @Req() req: { user?: { role?: string } },
    @Param('id') id: string,
  ): Promise<UserResponseDto> {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can view users');
    }
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
    @Req() req: { user?: { role?: string } },
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can update users');
    }
    const user = await this.commandBus.execute<UpdateUserCommand, User>(new UpdateUserCommand(id, dto));
    return UserResponseDto.fromEntity(user);
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar usuario (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario activado', type: UserResponseDto })
  async activate(
    @Req() req: { user?: { role?: string } },
    @Param('id') id: string,
  ): Promise<UserResponseDto> {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can activate users');
    }
    const user = await this.commandBus.execute<ActivateUserCommand, User>(new ActivateUserCommand(id));
    return UserResponseDto.fromEntity(user);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desactivar usuario (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado', type: UserResponseDto })
  async deactivate(
    @Req() req: { user?: { role?: string } },
    @Param('id') id: string,
  ): Promise<UserResponseDto> {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can deactivate users');
    }
    const user = await this.commandBus.execute<DeactivateUserCommand, User>(new DeactivateUserCommand(id));
    return UserResponseDto.fromEntity(user);
  }
}