import axios from "axios";
import { clearPersistedLikedTrackIds } from "./utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://panel.nexxacodeid.site";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // WAJIB BANGET, BOSQUU! Biar Cookie Laravel nempel 🐈‍🤣
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout when token expires or becomes invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      clearPersistedLikedTrackIds();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.replace("/");
    }
    return Promise.reject(error);
  },
);

export default api;
