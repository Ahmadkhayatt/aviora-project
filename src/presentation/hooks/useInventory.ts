// ====================================================================
// useInventory — React hook for inventory data with status filtering
// ====================================================================

import { useState, useEffect } from "react";
import type { ProductVariant } from "@/shared/types";
import { store } from "@/infrastructure/database/inMemoryStore";

export interface InventoryFilters {
  readonly status?: string;
  readonly material?: string;
  readonly size?: string;
  readonly gemstone?: string;
  readonly searchTerm?: string;
}

interface UseInventoryReturn {
  readonly variants: readonly ProductVariant[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
}

/**
 * Hook for accessing inventory data with optional status/material filtering.
 * Filters variants from the in-memory store.
 */
export function useInventory(filters?: InventoryFilters): UseInventoryReturn {
  const [variants, setVariants] = useState<readonly ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVariants = () => {
    setIsLoading(true);
    setError(null);

    try {
      const allProducts = store.getAllProducts();
      const allVariants: ProductVariant[] = [];
      for (const product of allProducts) {
        allVariants.push(...product.variants);
      }

      const filtered = allVariants.filter((variant) => {
        if (filters?.status && variant.status !== filters.status) return false;
        if (filters?.material && variant.material !== filters.material) return false;
        if (filters?.size && variant.size !== Number(filters.size)) return false;
        if (filters?.gemstone && variant.gemstone !== filters.gemstone) return false;
        if (filters?.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          const searchable = [variant.sku.toLowerCase(), variant.barcode.toLowerCase(), variant.material.toString().toLowerCase()].join(" ");
          if (!searchable.includes(term)) return false;
        }
        return true;
      });

      setVariants(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch inventory");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.status, filters?.material, filters?.size, filters?.gemstone, filters?.searchTerm]);

  return {
    variants,
    isLoading,
    error,
    refetch: loadVariants,
  };
}
