import api from "./axios";

export const login = async (email: string, password: string) => {
  try {
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
    // Panggil API logout Laravel buat revoke token (Opsional tapi lebih pro)
    await api.post("/api/logout");
  } catch (err) {
    console.warn(
      "Gagal revoke token di server, tapi session lokal tetep dihapus. 🐈‍🤣",
    );
  } finally {
    // Hapus data dari localStorage biar balik ke state login
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Refresh halaman biar semua state (termasuk playlist) keriset total
    window.location.reload();
  }
};
