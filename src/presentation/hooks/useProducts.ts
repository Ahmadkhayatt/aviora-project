// ====================================================================
// useProducts — React hook for accessing the product catalog
// ====================================================================

import { useState, useCallback } from "react";
import { store } from "@/infrastructure/database/inMemoryStore";

interface UseProductsReturn {
  readonly products: ReturnType<typeof store.getAllProducts>;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
}

/**
 * Hook for accessing the product catalog from the in-memory store.
 * Reads data synchronously from the store (no async fetch needed for demo).
 */
export function useProducts(): UseProductsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const products = store.getAllProducts();

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      store.getAllProducts();
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Force re-render when version changes
  void version;

  return {
    products,
    isLoading,
    error,
    refetch,
  };
}
