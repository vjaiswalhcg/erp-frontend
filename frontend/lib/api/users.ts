import apiClient from "./client";
import { User } from "@/lib/types/user";

export interface UserCreatePayload {
  email: string;
  password: string;
  role: User["role"];
}

export interface UserUpdatePayload {
  email?: string;
  password?: string;
  role?: User["role"];
  is_active?: boolean;
}

export const usersApi = {
  list: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>("/users/");
    return data;
  },
  create: async (payload: UserCreatePayload): Promise<User> => {
    const { data } = await apiClient.post<User>("/users/", payload);
    return data;
  },
  update: async (id: string, payload: UserUpdatePayload): Promise<User> => {
    const { data } = await apiClient.put<User>(`/users/${id}`, payload);
    return data;
  },
};
