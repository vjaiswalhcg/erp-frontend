export type UserRole = "admin" | "manager" | "staff" | "viewer";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}
