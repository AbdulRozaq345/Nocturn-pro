"use client"; // Ubah jadi client component biar bisa pake hooks

import "./globals.css";
import { MenuProvider } from "@/context/MenuContext";
import LoginModal from "@/components/LoginModal";
import { useEffect, useState } from "react";
import { PlayerProvider } from "@/context/PlayerContext";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import Player from "@/components/player";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <html lang="en">
<head>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
</head>
      <body className="antialiased bg-black text-white selection:bg-[#72fe8f] selection:text-black">
        <PlayerProvider>
          <MenuProvider>
            {!isLoggedIn && <LoginModal />}
            <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-white">
              <Sidebar />
              <div className="flex-grow flex flex-col relative overflow-y-auto custom-scrollbar w-full">
                <Topbar />
                {children}
              </div>
            </div>
            <Player />
          </MenuProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
