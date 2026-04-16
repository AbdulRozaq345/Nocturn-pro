"use client";
import { useState } from "react";
import { login, logout } from "@/lib/auth-service"; // Pastiin logout di-import

export default function LoginModal() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Debug buat mastiin datanya ada sebelum dikirim
    console.log("Attempting login with:", { email, password });

    try {
      await login(email, password);
      window.location.reload();
    } catch (err: any) {
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-white/10 w-full max-w-md p-8 rounded-lg shadow-2xl relative">
        {/* Tombol Logout buat darurat ganti akun */}
        <button
          onClick={() => {
            if (confirm("Terminate session?")) logout();
          }}
          className="absolute top-4 right-4 text-[9px] text-red-500 border border-red-500/20 px-2 py-1 rounded hover:bg-red-500 hover:text-white transition-all font-mono"
        >
          [ TERMINATE ]
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tighter text-white uppercase">
            Nocturn Login
          </h1>
          <p className="text-xs text-gray-500 mt-2 font-mono italic">
            NexxaCodeID v1.0 - Auth Protocol
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-400 ml-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email} // INI WAJIB ADA, BOSQUU!
              className="w-full bg-[#181818] border border-white/5 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#72fe8f]/50 transition-all font-mono"
              placeholder="admin@nexxa.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-400 ml-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password} // INI JUGA WAJIB!
              className="w-full bg-[#181818] border border-white/5 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#72fe8f]/50 transition-all font-mono"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded-full hover:bg-[#72fe8f] transition-all text-sm mt-4 uppercase tracking-tighter disabled:opacity-50"
          >
            {loading ? "Decrypting..." : "Enter System"}
          </button>
        </form>

        <p className="text-center text-[10px] text-gray-600 mt-6 font-mono">
          © 2026 NexxaCodeID. Marlboro-Powered. 🐈‍🤣
        </p>
      </div>
    </div>
  );
}
