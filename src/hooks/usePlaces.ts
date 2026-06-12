import { useState, useEffect, useCallback } from "react";
import { placesApi, ApiError } from "../api";

// ── Список всех заведений (для лендинга) ─────────────────────
export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    placesApi
      .list()
      .then((data) => {
        setPlaces(data);
        setLoading(false);
      })
      .catch((err) => {
        const msg =
          err instanceof ApiError ? err.message : "Не удалось загрузить места";
        setError(msg);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { places, loading, error, refetch };
}

// ── Поиск через AI ────────────────────────────────────────────
export function useSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (payload: SearchPayload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await placesApi.search(payload);
      setLoading(false);
      return result;
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Ошибка поиска";
      setError(msg);
      setLoading(false);
      return null;
    }
  }, []);

  return { search, loading, error };
}

