import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { UserRole } from '@maintflow/shared';

/** The authenticated principal attached to the request by JwtAuthGuard. */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  siteId: string;
}

/** Request shape once JwtAuthGuard has run. */
export interface AuthenticatedRequest {
  headers: { authorization?: string };
  user?: AuthUser;
}

/** Usage: `findAll(@CurrentUser() user: AuthUser)`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest<Required<AuthenticatedRequest>>().user;
  },
);
