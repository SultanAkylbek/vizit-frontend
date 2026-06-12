// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { placesApi, ApiError } from "../api";

export function usePlaces() {
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    placesApi
      .list()
      .then((data: any) => {
        setPlaces(data || []);
        setLoading(false);
      })
      .catch((err: any) => {
        const msg = err instanceof ApiError ? err.message : "Не удалось загрузить места";
        setError(msg);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { places, loading, error, refetch };
}

export function useSearch() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (payload: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await placesApi.search(payload);
      setLoading(false);
      return result;
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Ошибка поиска";
      setError(msg);
      setLoading(false);
      return null;
    }
  }, []);

  return { search, loading, error };
}
