"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface PlayerContextType {
  tracks: any[];
  setTracks: (tracks: any[]) => void;
  currentTrack: any;
  setCurrentTrack: (track: any) => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <PlayerContext.Provider
      value={{
        tracks,
        setTracks,
        currentTrack,
        setCurrentTrack,
        isPlaying,
        setIsPlaying,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
