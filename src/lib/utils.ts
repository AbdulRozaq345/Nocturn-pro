import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LIKED_TRACK_IDS_KEY = "notcer_liked_track_ids";

function getCurrentUserStorageKey() {
  if (typeof window === "undefined") {
    return "default";
  }

  try {
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    return String(parsedUser?.id || parsedUser?.email || "default");
  } catch {
    return "default";
  }
}

function getLikedTracksStorageKey() {
  return `${LIKED_TRACK_IDS_KEY}_${getCurrentUserStorageKey()}`;
}

export function getPersistedLikedTrackIds() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const storedValue = localStorage.getItem(getLikedTracksStorageKey());
    const parsedValue = storedValue
      ? (JSON.parse(storedValue) as string[])
      : [];
    return new Set(parsedValue.map(String));
  } catch {
    return new Set<string>();
  }
}

export function setPersistedLikedTrackId(
  trackId: string | number,
  liked: boolean,
) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedTrackId = String(trackId);

  try {
    const currentIds = getPersistedLikedTrackIds();
    if (liked) {
      currentIds.add(normalizedTrackId);
    } else {
      currentIds.delete(normalizedTrackId);
    }

    localStorage.setItem(
      getLikedTracksStorageKey(),
      JSON.stringify([...currentIds]),
    );
  } catch {
    // Ignore storage failures and fall back to in-memory state.
  }
}

export function clearPersistedLikedTrackIds() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(getLikedTracksStorageKey());
  } catch {
    // Ignore storage failures.
  }
}

export function applyPersistedLikeState(track: any) {
  const likedTrackIds = getPersistedLikedTrackIds();
  const trackId = track?.id;

  return {
    ...track,
    is_liked: Boolean(track?.is_liked) || likedTrackIds.has(String(trackId)),
  };
}
