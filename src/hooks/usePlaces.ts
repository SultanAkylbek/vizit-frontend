// src/hooks/usePlaces.ts
// Зависит только от ../api/index.ts — больше ничего

import { useState, useEffect, useCallback } from "react";
import { placesApi, ApiError } from "../api/index";
import type { Place } from "../api/index";

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
        setPlaces(data);
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
