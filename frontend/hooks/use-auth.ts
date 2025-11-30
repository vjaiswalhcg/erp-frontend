"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { clearAuth, getAccessToken, getStoredUser, setAuthFromTokens } from "@/lib/auth";
import { User } from "@/lib/types/user";

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existingUser = getStoredUser();
    const token = getAccessToken();
    if (existingUser && token) {
      setUser(existingUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const resp = await authApi.login(email, password);
    setAuthFromTokens(resp.access_token, resp.refresh_token, resp.user);
    setUser(resp.user);
    router.replace("/dashboard");
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    if (pathname !== "/login") {
      router.replace("/login");
    }
  };

  return { user, loading, login, logout, isAuthenticated: !!user };
}
