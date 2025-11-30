export type UserRole = "admin" | "manager" | "staff" | "viewer";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}
