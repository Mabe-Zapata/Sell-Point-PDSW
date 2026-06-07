import { Controller, Get, Post, Put, Param, Body, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { ListRolesQuery } from '../../application/cqrs/role/queries/list-roles/list-roles.query';
import { GetRoleQuery } from '../../application/cqrs/role/queries/get-role/get-role.query';
import { CreateRoleCommand } from '../../application/cqrs/role/commands/create-role/create-role.command';
import { UpdateRoleCommand } from '../../application/cqrs/role/commands/update-role/update-role.command';
import { RoleResponseDto } from '../../application/dto/role/role-response.dto';
import { CreateRoleDto } from '../../application/dto/role/create-role.dto';
import { UpdateRoleDto } from '../../application/dto/role/update-role.dto';
import { Role } from '../../domain/entities/role.entity';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('roles')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RoleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar todos los roles' })
  @ApiResponse({ status: 200, description: 'Lista de roles', type: RoleResponseDto, isArray: true })
  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.queryBus.execute<ListRolesQuery, Role[]>(new ListRolesQuery());
    return RoleResponseDto.fromEntities(roles);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener rol por ID' })
  @ApiParam({ name: 'id', description: 'UUID del rol' })
  @ApiResponse({ status: 200, description: 'Rol encontrado', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RoleResponseDto> {
    const role = await this.queryBus.execute<GetRoleQuery, Role>(new GetRoleQuery(id));
    return RoleResponseDto.fromEntity(role);
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo rol (solo ADMIN)' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: 'Rol creado', type: RoleResponseDto })
  @ApiResponse({ status: 409, description: 'Rol ya existe' })
  async create(@Body() dto: CreateRoleDto): Promise<RoleResponseDto> {
    const role = await this.commandBus.execute<CreateRoleCommand, Role>(new CreateRoleCommand(dto));
    return RoleResponseDto.fromEntity(role);
  }

  @Put(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar rol (solo ADMIN)' })
  @ApiParam({ name: 'id', description: 'UUID del rol' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Rol actualizado', type: RoleResponseDto })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const role = await this.commandBus.execute<UpdateRoleCommand, Role>(new UpdateRoleCommand(id, dto));
    return RoleResponseDto.fromEntity(role);
  }
}
