import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://erp-backend-fb7fdd6n4a-uc.a.run.app/api/v1",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer my-api-secret-key",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
