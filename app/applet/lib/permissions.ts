import { User, UserPermissions } from '../types';

export const hasPermission = (
  user: User | undefined,
  module: keyof UserPermissions,
  action: 'view' | 'create' | 'edit' | 'delete'
): boolean => {
  if (!user) return false;
  if (user.role === 'Admin') return true;
  if (!user.permissions) return true;
  
  const modulePerms = user.permissions[module];
  if (!modulePerms) return true;
  
  return modulePerms[action] !== undefined ? modulePerms[action] : true;
};
