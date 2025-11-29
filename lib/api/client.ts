import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://erp-backend-377784510062.us-central1.run.app/api/v1",
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
