import apiClient from "./client";
import { User } from "@/lib/types/user";

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    return data;
  },
  register: async (email: string, password: string): Promise<User> => {
    const { data } = await apiClient.post<User>("/auth/register", {
      email,
      password,
    });
    return data;
  },
  refresh: async (refresh_token: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>("/auth/refresh", {
      refresh_token,
    });
    return data;
  },
  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>("/auth/me");
    return data;
  },
};
