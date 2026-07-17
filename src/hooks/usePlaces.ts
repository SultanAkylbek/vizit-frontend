// src/hooks/usePlaces.ts
// Зависит только от ../api/index.ts — больше ничего

import { useState, useEffect, useCallback } from "react";
import { placesApi, ApiError } from "../api/index";
import type { Place } from "../api/index";

const LOCAL_KEY = "vizit_local_places";

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    placesApi
      .list()
      .then((data: Place[]) => {
        // Merge remote places with locally added places stored in localStorage.
        try {
          const raw = localStorage.getItem(LOCAL_KEY);
          if (raw) {
            const local: Place[] = JSON.parse(raw);
            // mark local entries so UI can prioritise them
            const localMarked = local.map((p) => ({ ...p, __local: true } as unknown as Place));
            // Dedupe by slug: prefer localMarked when slug collides
            const remoteFiltered = data.filter((r) => !localMarked.some((l) => l.slug === r.slug));
            setPlaces([...localMarked, ...remoteFiltered]);
          } else {
            setPlaces(data);
          }
        } catch (e) {
          setPlaces(data);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof ApiError
            ? err.message
            : "Не удалось загрузить заведения";
        setError(msg);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { places, loading, error, refetch };
}
