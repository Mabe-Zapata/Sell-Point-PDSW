import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListRolesQuery } from '../../../../../application/cqrs/role/queries/list-roles/list-roles.query';
import { ListRolesHandler as ApplicationListRolesHandler } from '../../../../../application/cqrs/role/queries/list-roles/list-roles.handler';
import { RoleRepository } from '../../../../repositories/role.repository';
import { ROLE_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(ListRolesQuery)
export class ListRolesHandler implements IQueryHandler<ListRolesQuery> {
  private readonly appHandler: ApplicationListRolesHandler;

  constructor(
    @Inject(ROLE_REPOSITORY) roleRepository: RoleRepository,
  ) {
    this.appHandler = new ApplicationListRolesHandler(roleRepository);
  }

  async execute(query: ListRolesQuery) {
    return this.appHandler.execute();
  }
}
