import { SoftDeleteFields } from "./common";

export type UserRole = "admin" | "manager" | "staff" | "viewer";

export interface User extends SoftDeleteFields {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  // Audit fields
  created_at: string;
  updated_at: string;
  created_by_id: string | null;
  last_modified_by_id: string | null;
}

export interface UserCreate {
  email: string;
  password: string;
  role?: UserRole;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface UserUpdate {
  email?: string;
  password?: string;
  role?: UserRole;
  is_active?: boolean;
  first_name?: string;
  last_name?: string;
  phone?: string;
}
