import { usePage } from '@inertiajs/react';
import { AuthProps } from '@/types/global';

export function usePermission() {
  const { auth } = usePage<AuthProps>().props;
  const user = auth?.user;

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    const rolesToCheck = Array.isArray(role) ? role : [role];
    return rolesToCheck.some(
      (r) =>
        user.roles?.some((userRole) => userRole.toLowerCase() === r.toLowerCase()) ||
        user.role?.toLowerCase() === r.toLowerCase()
    );
  };

  const can = (permission: string): boolean => {
    if (!user) return false;
    // Admin & Developer have access to everything
    if (hasRole(['Admin', 'Developer'])) {
      return true;
    }
    return user.permissions?.includes(permission) ?? false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (hasRole(['Admin', 'Developer'])) {
      return true;
    }
    return permissions.some((p) => user.permissions?.includes(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    if (hasRole(['Admin', 'Developer'])) {
      return true;
    }
    return permissions.every((p) => user.permissions?.includes(p));
  };

  return { can, hasRole, hasAnyPermission, hasAllPermissions, user };
}
