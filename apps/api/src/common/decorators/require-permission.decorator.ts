import { SetMetadata } from '@nestjs/common';

import type { Permission } from '@maintflow/shared';

export const PERMISSIONS_KEY = 'permissions';

/** Guard a route behind one or more permissions. Checked by PermissionsGuard. */
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
