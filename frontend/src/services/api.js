// src/services/api.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://ticket.pilargroup.id/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  // ✅ jangan set Content-Type default di sini
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (isFormData) {
    // ✅ penting: biarin axios set boundary multipart sendiri
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];

    // kadang axios simpan di common
    if (config.headers?.common) {
      delete config.headers.common["Content-Type"];
      delete config.headers.common["content-type"];
    }
  } else {
    // JSON request normal
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => {
    const rt = response?.config?.responseType;
    if (rt === "blob" || rt === "arraybuffer") return response;

    return response.data ?? response;
  },
(error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Kalau mock mode, jangan redirect ke SSO
      if (import.meta.env.VITE_MOCK_AUTH === 'true') {
        return Promise.reject(error);
      }

      const ssoLoginUrl = import.meta.env.VITE_SSO_LOGIN_URL || "https://pilargroup.id/login";
      const redirectUrl = `${ssoLoginUrl}?redirect=${encodeURIComponent(window.location.href)}`;
      window.location.href = redirectUrl;
    }
    return Promise.reject(error);
  },
);

/**
 * Download file helper
 */
export const apiDownload = async (
  endpoint,
  params = {},
  filename = "download.xlsx",
) => {
  const response = await api.get(endpoint, {
    params,
    responseType: "blob",
  });

  const blob =
    response?.data instanceof Blob ? response.data : new Blob([response?.data]);

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return response;
};

export default api;
