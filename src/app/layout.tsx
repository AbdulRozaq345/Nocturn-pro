"use client"; // Ubah jadi client component biar bisa pake hooks

import "./globals.css";
import { MenuProvider } from "@/context/MenuContext";
import LoginModal from "@/components/LoginModal";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PlayerProvider } from "@/context/PlayerContext";
import { AudioAnalyserProvider } from "@/context/AudioAnalyserContext";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import Player from "@/components/player";
import OfflineSyncProvider from "@/components/OfflineSyncProvider";
import MaintenanceAlert from "@/components/alert";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === "undefined") return true;
    return !!localStorage.getItem("token");
  });
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [pathname]);

  // Auto-redirect ke halaman offline ketika tidak ada koneksi internet
  useEffect(() => {
    const offlinePages = ["/downloaded", "/_offline"];

    const goOffline = () => {
      const currentPath = window.location.pathname;
      if (!offlinePages.includes(currentPath)) {
        router.replace("/downloaded");
      }
    };

    window.addEventListener("offline", goOffline);

    // Cek saat pertama kali app dibuka
    if (!navigator.onLine) {
      goOffline();
    }

    return () => {
      window.removeEventListener("offline", goOffline);
    };
  }, [router]);

  const isCallbackPage = pathname === "/auth/callback";

  return (
    <html lang="en">
<head>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#72fe8f" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Nocturn" />
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
</head>
      <body className="antialiased bg-black text-white selection:bg-[#72fe8f] selection:text-black">
        <PlayerProvider>
          <AudioAnalyserProvider>
            <MenuProvider>
              {!isLoggedIn && !isCallbackPage && <LoginModal />}
              <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-white">
                <Sidebar />
                <div className="flex-grow flex flex-col relative overflow-y-auto custom-scrollbar w-full">
                  <Topbar />
                  <MaintenanceAlert pollIntervalMs={5000} />
                  {children}
                </div>
              </div>
              <Player />
              <OfflineSyncProvider />
            </MenuProvider>
          </AudioAnalyserProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
