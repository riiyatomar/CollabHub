import { WorkspaceRole } from '@prisma/client';

export const Permissions = {
  // Workspace
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',
  WORKSPACE_INVITE: 'workspace:invite',
  WORKSPACE_REMOVE_MEMBER: 'workspace:remove_member',
  WORKSPACE_CHANGE_ROLE: 'workspace:change_role',
  WORKSPACE_ARCHIVE: 'workspace:archive',
  WORKSPACE_TRANSFER_OWNERSHIP: 'workspace:transfer_ownership',
  WORKSPACE_MODERATE_MEMBER: 'workspace:moderate_member',

  // Channel
  CHANNEL_CREATE: 'channel:create',
  CHANNEL_UPDATE: 'channel:update',
  CHANNEL_DELETE: 'channel:delete',

  // Messages
  MESSAGE_DELETE_ANY: 'message:delete_any',
  MESSAGE_PIN: 'message:pin',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

export const RolePermissions: Record<WorkspaceRole, Permission[]> = {
  OWNER: [
    Permissions.WORKSPACE_UPDATE,
    Permissions.WORKSPACE_DELETE,
    Permissions.WORKSPACE_INVITE,
    Permissions.WORKSPACE_REMOVE_MEMBER,
    Permissions.WORKSPACE_CHANGE_ROLE,
    Permissions.WORKSPACE_ARCHIVE,
    Permissions.WORKSPACE_TRANSFER_OWNERSHIP,
    Permissions.WORKSPACE_MODERATE_MEMBER,
    Permissions.CHANNEL_CREATE,
    Permissions.CHANNEL_UPDATE,
    Permissions.CHANNEL_DELETE,
    Permissions.MESSAGE_DELETE_ANY,
    Permissions.MESSAGE_PIN,
  ],
  ADMIN: [
    Permissions.WORKSPACE_UPDATE,
    Permissions.WORKSPACE_INVITE,
    Permissions.WORKSPACE_REMOVE_MEMBER,
    Permissions.WORKSPACE_CHANGE_ROLE,
    Permissions.WORKSPACE_ARCHIVE,
    Permissions.WORKSPACE_MODERATE_MEMBER,
    Permissions.CHANNEL_CREATE,
    Permissions.CHANNEL_UPDATE,
    Permissions.CHANNEL_DELETE,
    Permissions.MESSAGE_DELETE_ANY,
    Permissions.MESSAGE_PIN,
  ],
  MODERATOR: [
    Permissions.WORKSPACE_INVITE,
    Permissions.WORKSPACE_MODERATE_MEMBER,
    Permissions.MESSAGE_DELETE_ANY,
    Permissions.MESSAGE_PIN,
  ],
  MEMBER: [
    // Standard chat capabilities are implicitly allowed for members
  ],
  GUEST: [
    // Read-only access
  ],
};

export const hasPermission = (role: WorkspaceRole, permission: Permission): boolean => {
  return RolePermissions[role].includes(permission);
};
