// src/hooks/useRecentPlaces.ts
// Small localStorage-backed "recently viewed places" list.
// No hardcoded/fake entries: PlacePage pushes into this after a real
// successful fetch, and Sidebar reads it back.

import { useCallback, useState } from "react";

export interface RecentPlace {
  slug: string;
  name: string;
  district?: string;
}

const KEY = "vizit_recent_places";
const MAX_ITEMS = 8;

function readRaw(): RecentPlace[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useRecentPlaces() {
  const [recentPlaces, setRecentPlaces] = useState<RecentPlace[]>(() => readRaw());

  const pushRecentPlace = useCallback((place: RecentPlace) => {
    if (!place?.slug) return;
    const current = readRaw();
    const next = [place, ...current.filter((p) => p.slug !== place.slug)].slice(0, MAX_ITEMS);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* localStorage may be unavailable (private mode, quota) — ignore */
    }
    setRecentPlaces(next);
  }, []);

  return { recentPlaces: recentPlaces ?? [], pushRecentPlace };
}
