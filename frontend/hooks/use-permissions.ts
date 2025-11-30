"use client";

import { useAuth } from "./use-auth";
import { UserRole } from "@/lib/types/user";

// Define permission levels for each role
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  manager: 3,
  staff: 2,
  viewer: 1,
};

// Define what each role can do
const PERMISSIONS = {
  // CRUD permissions
  canCreate: ["admin", "manager", "staff"] as UserRole[],
  canEdit: ["admin", "manager", "staff"] as UserRole[],
  canDelete: ["admin", "manager"] as UserRole[],
  
  // Admin permissions
  canManageUsers: ["admin"] as UserRole[],
  canViewReports: ["admin", "manager"] as UserRole[],
  
  // View permissions (all roles)
  canView: ["admin", "manager", "staff", "viewer"] as UserRole[],
};

export type Permission = keyof typeof PERMISSIONS;

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || "viewer";

  const hasPermission = (permission: Permission): boolean => {
    return PERMISSIONS[permission].includes(role);
  };

  const hasRole = (requiredRole: UserRole): boolean => {
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
  };

  const isAdmin = role === "admin";
  const isManager = role === "manager" || role === "admin";
  const isStaff = ["admin", "manager", "staff"].includes(role);

  return {
    role,
    hasPermission,
    hasRole,
    isAdmin,
    isManager,
    isStaff,
    // Convenience shortcuts
    canCreate: hasPermission("canCreate"),
    canEdit: hasPermission("canEdit"),
    canDelete: hasPermission("canDelete"),
    canManageUsers: hasPermission("canManageUsers"),
    canViewReports: hasPermission("canViewReports"),
  };
}

