"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AuthCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");

    if (token && userStr) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", decodeURIComponent(userStr));
      // Balik ke halaman utama/dashboard setelah berhasil login
      window.location.href = "/";
    } else {
      // Jika tidak ada token (kemungkinan user menekan back atau ada error), redirect ulang ke home
      // Nantinya LoginModal akan muncul dengan sendirinya karena token tidak ada
      const timeout = setTimeout(() => {
        window.location.href = "/";
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen text-[#72fe8f] font-mono text-xs tracking-[0.3em] bg-[#121212]">
      <div className="w-8 h-8 border-2 border-[#72fe8f] border-t-transparent rounded-full animate-spin mb-4" />
      AUTHENTICATING...
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center w-full h-screen text-[#72fe8f] bg-[#121212]">
          <div className="w-8 h-8 border-2 border-[#72fe8f] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
