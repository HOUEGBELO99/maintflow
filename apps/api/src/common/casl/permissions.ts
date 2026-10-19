/**
 * The role → permission matrix lives in @maintflow/shared so the API (which
 * enforces it) and the web UI (which mirrors it) can never drift apart.
 * RLS in Postgres remains the second line of defense.
 */
export { ROLE_PERMISSIONS, permissionsForRole, roleHasPermission } from '@maintflow/shared';
