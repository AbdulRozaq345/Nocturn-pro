"use client";
import { useState, useEffect } from "react";
import { login, logout, loginWithGoogle } from "@/lib/auth-service";

export default function LoginModal() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Ini biasanya redirect ke Laravel, jadi loading bakal tetep true
      // sampe halaman pindah ke Google
      await loginWithGoogle();
    } catch (err: any) {
      alert("Protocol Error: " + err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      // Pake replace biar gak bisa back ke login lagi
      window.location.replace("/dashboard"); 
    } catch (err: any) {
      alert("Unauthorized: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-white/10 w-full max-w-md p-8 rounded-lg shadow-2xl relative overflow-hidden">
        
        {/* Progress Bar pas Loading biar keren */}
        {loading && (
          <div className="absolute top-0 left-0 h-[2px] bg-[#72fe8f] animate-pulse w-full shadow-[0_0_10px_#72fe8f]" />
        )}

        <button
          onClick={() => {
            if (confirm("Terminate all active protocols?")) logout();
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
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              className="w-full bg-[#181818] border border-white/5 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#72fe8f]/50 transition-all font-mono text-white"
              placeholder="admin@nexxa.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-400 ml-1">
              Secret Key
            </label>
            <input
              type="password"
              required
              value={password}
              className="w-full bg-[#181818] border border-white/5 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#72fe8f]/50 transition-all font-mono text-white"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded-full hover:bg-[#72fe8f] transition-all text-sm mt-4 uppercase tracking-tighter disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Processing...
              </span>
            ) : "Enter System"}
          </button>
        </form>

        <div className="relative flex items-center py-6">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-[10px] text-gray-500 uppercase tracking-widest font-mono">
            Secure OAuth
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          className="w-full bg-[#181818] border border-white/10 text-white font-bold py-3 rounded-full hover:bg-white/5 hover:border-white/30 transition-all text-sm uppercase tracking-tighter disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z"
            />
          </svg>
          Sync with Google
        </button>

        <p className="text-center text-[10px] text-gray-600 mt-6 font-mono">
          © 2026 NexxaCodeID. Marlboro-Powered. 🐈‍🤣
        </p>
      </div>
    </div>
  );
}