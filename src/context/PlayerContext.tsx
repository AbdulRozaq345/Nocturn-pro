"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

interface PlayerContextType {
  tracks: any[];
  setTracks: Dispatch<SetStateAction<any[]>>;
  queue: any[];
  setQueue: Dispatch<SetStateAction<any[]>>;
  shuffleQueue: any[];
  setShuffleQueue: Dispatch<SetStateAction<any[]>>;
  currentTrack: any;
  setCurrentTrack: Dispatch<SetStateAction<any>>;
  isPlaying: boolean;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  togglePlay: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [shuffleQueue, setShuffleQueue] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <PlayerContext.Provider
      value={{
        tracks,
        setTracks,
        queue,
        setQueue,
        shuffleQueue,
        setShuffleQueue,
        currentTrack,
        setCurrentTrack,
        isPlaying,
        setIsPlaying,
        togglePlay,
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
