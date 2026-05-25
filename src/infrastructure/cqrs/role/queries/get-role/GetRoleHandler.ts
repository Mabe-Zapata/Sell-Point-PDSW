import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetRoleQuery } from '../../../../../application/cqrs/role/queries/get-role/get-role.query';
import { GetRoleHandler as ApplicationGetRoleHandler } from '../../../../../application/cqrs/role/queries/get-role/get-role.handler';
import { RoleRepository } from '../../../../repositories/role.repository';
import { ROLE_REPOSITORY } from '../../../../common/injection-tokens';

@QueryHandler(GetRoleQuery)
export class GetRoleHandler implements IQueryHandler<GetRoleQuery> {
  private readonly appHandler: ApplicationGetRoleHandler;

  constructor(
    @Inject(ROLE_REPOSITORY) roleRepository: RoleRepository,
  ) {
    this.appHandler = new ApplicationGetRoleHandler(roleRepository);
  }

  async execute(query: GetRoleQuery) {
    return this.appHandler.execute(query);
  }
}
