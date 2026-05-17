"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  Dispatch,
  SetStateAction,
  MutableRefObject,
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
  /** Ref ke fungsi playTrackImmediate di Player — gunakan untuk play tanpa melalui React render cycle */
  playTrackRef: MutableRefObject<(track: any) => void>;
  /** Queue side panel state (desktop) */
  isQueueOpen: boolean;
  setIsQueueOpen: Dispatch<SetStateAction<boolean>>;
  /** Sleep timer — millis sampai stop, atau null kalau off */
  sleepTimerUntil: number | null;
  setSleepTimerUntil: Dispatch<SetStateAction<number | null>>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [shuffleQueue, setShuffleQueue] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [sleepTimerUntil, setSleepTimerUntil] = useState<number | null>(null);
  // Diisi oleh Player component dengan fungsi playTrackImmediate-nya
  const playTrackRef = useRef<(track: any) => void>(() => {});

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
        playTrackRef,
        isQueueOpen,
        setIsQueueOpen,
        sleepTimerUntil,
        setSleepTimerUntil,
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
