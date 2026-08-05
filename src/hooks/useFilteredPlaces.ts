// src/hooks/useFilteredPlaces.ts
// Hook for fetching places with optional category, city, district filters

import { useState, useEffect, useCallback } from "react";
import { placesApi, Place } from "../api/index";

export function useFilteredPlaces(filters: {
  category?: string | null;
  city?: string | null;
  district?: string | null;
}) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    placesApi
      .list()
      .then((data: Place[]) => {
        let filtered = data;
        if (filters.category) {
          filtered = filtered.filter((p) => p.category === filters.category);
        }
        if (filters.city) {
          const cityLower = filters.city.toLowerCase();
          filtered = filtered.filter(
            (p) => (p.city || "").toLowerCase() === cityLower || (p.district || "").toLowerCase() === cityLower
          );
        }
        if (filters.district) {
          const districtLower = filters.district.toLowerCase();
          filtered = filtered.filter(
            (p) => (p.district || "").toLowerCase() === districtLower
          );
        }
        setPlaces(filtered);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Не удалось загрузить заведения";
        setError(msg);
        setLoading(false);
      });
  }, [filters.category, filters.city, filters.district]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { places, loading, error, refetch };
}
