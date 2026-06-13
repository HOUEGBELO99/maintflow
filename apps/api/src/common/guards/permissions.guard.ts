import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { Permission } from '@maintflow/shared';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { roleHasPermission } from '../casl/permissions';
import type { AuthUser } from '../decorators/current-user.decorator';

/** Enforces @RequirePermission(...) using the role → permission matrix. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    if (!user) throw new ForbiddenException('No authenticated user');

    const ok = required.every((perm) => roleHasPermission(user.role, perm));
    if (!ok) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
