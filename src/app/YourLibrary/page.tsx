"use client";
import React from "react";
import YourLibrary from "@/components/YourLibrary";
import Sidebar from "@/components/sidebar";

export default function YourLibraryPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0e0e0e] text-white">
      <Sidebar />
      <main className="flex-grow relative overflow-y-auto custom-scrollbar bg-[#000000] pb-36 md:pb-24">
        <header className="h-16 md:h-20 flex justify-between items-center px-4 md:px-12 sticky top-0 z-40 bg-[#000000]/80 backdrop-blur-md">
          <div className="text-[0.6rem] text-gray-400 font-mono tracking-[0.3em]">
            NOTCER_STATION_V1.0
          </div>
          <div className="flex gap-6 text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">
            <a href="#" className="text-[#72fe8f]">
              Feed
            </a>
            <a href="#" className="hover:text-white">
              Collect
            </a>
            <a href="#" className="hover:text-white">
              Labs
            </a>
          </div>
        </header>

        <YourLibrary />
      </main>
    </div>
  );
}
