import axios from "axios";
import { clearAuth, getAccessToken, getRefreshToken, setAuthFromTokens } from "@/lib/auth";

// Use environment variable for API URL - set NEXT_PUBLIC_API_URL in your .env.local
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const resp = await axios.post(
            `${BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );
          const { access_token, refresh_token, user } = resp.data;
          setAuthFromTokens(access_token, refresh_token, user);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          clearAuth();
        }
      } else {
        clearAuth();
      }
    }
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
