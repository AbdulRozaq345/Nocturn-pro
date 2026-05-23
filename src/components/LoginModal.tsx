"use client";
import { useState } from "react";
import { login, loginWithGoogle } from "@/lib/auth-service";

export default function LoginModal() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const oauthErrorParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("error")
      : null;

  const oauthError =
    oauthErrorParam === "GoogleAuthFailed"
      ? "Google login gagal di server callback. Cek GOOGLE_REDIRECT_URL, client secret, dan log backend."
      : oauthErrorParam
        ? `Google login gagal: ${oauthErrorParam}`
        : null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      alert("Google login error: " + err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      window.location.replace("/dashboard");
    } catch (err: any) {
      alert("Login gagal: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-[#72fe8f]/10 w-full max-w-sm p-8 rounded-xl shadow-2xl relative overflow-hidden">
        {/* Progress Bar */}
        {loading && (
          <div className="absolute top-0 left-0 h-[2px] w-full bg-[#72fe8f] shadow-[0_0_12px_#72fe8f] animate-pulse" />
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#72fe8f]/10 border border-[#72fe8f]/20 mb-4">
            <span className="text-[#72fe8f] font-bold text-lg">N</span>
          </div>
          <h1 className="text-xl font-bold tracking-tighter text-white uppercase">
            Nocturn
          </h1>
          <p className="text-[10px] text-gray-500 mt-1 font-mono">
            NexxaCodeID v1.0
          </p>
          {oauthError && (
            <p className="mt-3 text-[10px] text-red-400 border border-red-500/20 bg-red-500/10 rounded-lg px-3 py-2 font-mono text-left">
              {oauthError}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 ml-1 font-mono">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@kamu.com"
              className="w-full bg-[#181818] border border-white/5 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#72fe8f]/40 transition-all font-mono text-white placeholder:text-gray-700 mt-1"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 ml-1 font-mono">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#181818] border border-white/5 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#72fe8f]/40 transition-all font-mono text-white mt-1"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#72fe8f] text-black font-bold py-2.5 rounded-full hover:bg-[#5de87a] transition-all text-sm uppercase tracking-tighter disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center py-5">
          <div className="flex-grow border-t border-white/5" />
          <span className="flex-shrink-0 mx-4 text-[9px] text-gray-600 uppercase tracking-widest font-mono">
            atau
          </span>
          <div className="flex-grow border-t border-white/5" />
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          className="w-full bg-[#181818] border border-white/8 text-gray-400 py-2.5 rounded-full hover:border-white/20 hover:text-white transition-all text-sm uppercase tracking-tighter disabled:opacity-50 flex items-center justify-center gap-2 font-mono"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z"
            />
          </svg>
          Masuk dengan Google
        </button>

        {/* Footer */}
        <p className="text-center text-[9px] text-gray-700 mt-6 font-mono">
          © 2026 NexxaCodeID · Marlboro-Powered 🐈
        </p>
      </div>
    </div>
  );
}
