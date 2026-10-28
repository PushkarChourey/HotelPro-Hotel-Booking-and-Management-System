/**
 * Role-Based Access Control (RBAC) permission definitions
 */

export type UserRole = 'guest' | 'staff' | 'manager' | 'admin';

export interface UserAuthContext {
  id: string;
  email: string;
  role: UserRole;
  hotelId?: string; // Assigned hotel for staff/manager
}

export function canCheckInGuest(role: UserRole): boolean {
  return role === 'staff' || role === 'manager' || role === 'admin';
}

export function canManageHousekeeping(role: UserRole): boolean {
  return role === 'staff' || role === 'manager' || role === 'admin';
}

export function canManageInventory(role: UserRole): boolean {
  return role === 'manager' || role === 'admin';
}

export function canApproveRefund(role: UserRole): boolean {
  return role === 'manager' || role === 'admin';
}

export function canAccessAdminLogs(role: UserRole): boolean {
  return role === 'admin';
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin';
}
