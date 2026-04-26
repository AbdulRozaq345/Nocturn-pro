import api from "./axios";
import { clearPersistedLikedTrackIds } from "./utils";

export const initCsrf = async () => {
  await api.get("/sanctum/csrf-cookie");
};

export const loginWithGoogle = async () => {
  try {
    // 1. Inisialisasi CSRF dulu biar aman
    await initCsrf();
    // 2. Redirect ke backend
    window.location.href = `${api.defaults.baseURL}/api/auth/google/redirect`;
  } catch (err: any) {
    throw err.response?.data?.message || "Gagal inisiasi Google Login! 🗿";
  }
};

// 3. FUNGSI BARU: Nangkep user setelah redirect Google
export const handleGoogleCallback = async () => {
  try {
    // Panggil endpoint backend yang balikin data user/token setelah sukses login Google
    const res = await api.get("/api/user");

    if (res.data) {
      // Simpan ke localStorage biar frontend "sadar" sudah login
      localStorage.setItem("user", JSON.stringify(res.data));
      // Kalau backend lo ngasih token baru di sini, simpen juga:
      if (res.data.token) localStorage.setItem("token", res.data.token);

      return res.data;
    }
  } catch (err) {
    console.error("Session Google gak nemu, bosquu! 🗿");
    throw err;
  }
};

export const login = async (email: string, password: string) => {
  try {
    await initCsrf(); // Biasakan init CSRF sebelum POST
    const res = await api.post("/api/login", { email, password });
    if (res.data.access_token) {
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }
    return res.data;
  } catch (err: any) {
    throw err.response?.data?.message || "Login gagal, ju! 🗿";
  }
};

export const logout = async () => {
  try {
    await api.post("/api/logout");
  } catch (err) {
    console.warn("Gagal revoke token di server. 🐈‍🤣");
  } finally {
    clearPersistedLikedTrackIds();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("/"); // Pake replace biar bersih
  }
};
