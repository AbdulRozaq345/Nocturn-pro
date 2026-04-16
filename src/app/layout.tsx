"use client"; // Ubah jadi client component biar bisa pake hooks

import "./globals.css";
import { MenuProvider } from "@/context/MenuContext";
import LoginModal from "@/components/LoginModal";
import { useEffect, useState } from "react";
import { PlayerProvider } from "@/context/PlayerContext";
import Player from "@/components/player";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Default true buat hindari flickering

  useEffect(() => {
    // Cek token di localStorage
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <html lang="en">
      <body className="antialiased bg-black text-white selection:bg-[#72fe8f] selection:text-black">
        <PlayerProvider>
          <MenuProvider>
            {/* Kalau belum login, kasih tembok LoginModal, bosquu! */}
            {!isLoggedIn && <LoginModal />}

            {children}

            {/* Render Player di RootLayout biar main terus waktu pindah halaman */}
            <Player />
          </MenuProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
