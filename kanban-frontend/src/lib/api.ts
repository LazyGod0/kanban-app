import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequestConfig | undefined;
    const requestUrl = request?.url ?? "";
    const isUnauthorized = error.response?.status === 401;
    const authAction = requestUrl.split("?")[0];
    const isAuthRequest = [
      "/auth/register",
      "/auth/signin",
      "/auth/refresh",
      "/auth/signout",
    ].includes(authAction);

    if (!request || !isUnauthorized || request._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    request._retry = true;

    try {
      await api.post("/auth/refresh");
      return api(request);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default api;
