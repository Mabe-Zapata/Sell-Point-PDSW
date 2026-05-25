import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ListRolesQuery } from '../../application/cqrs/role/queries/list-roles/list-roles.query';
import { RoleResponseDto } from '../../application/dto/role/role-response.dto';
import { Role } from '../../domain/entities/role.entity';

@ApiTags('roles')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RoleController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar todos los roles' })
  @ApiResponse({ status: 200, description: 'Lista de roles', type: RoleResponseDto, isArray: true })
  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.queryBus.execute<ListRolesQuery, Role[]>(new ListRolesQuery());
    return RoleResponseDto.fromEntities(roles);
  }
}