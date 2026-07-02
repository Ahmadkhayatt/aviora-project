// ====================================================================
// useBarcode — React hook for barcode generation
// ====================================================================

import { useState, useCallback } from "react";
import { BarcodeGenerator } from "@/domain/services/BarcodeGenerator";
import { BarcodeFormat } from "@/shared/types";

interface UseBarcodeReturn {
  readonly generateBarcode: (data: string, format?: BarcodeFormat) => { barcode: string | null; error: string | null };
  readonly isGenerating: boolean;
  readonly error: string | null;
}

/**
 * Hook for generating barcodes using the BarcodeGenerator domain service.
 */
export function useBarcode(): UseBarcodeReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateBarcode = useCallback(
    (data: string, format: BarcodeFormat = BarcodeFormat.CODE128B): { barcode: string | null; error: string | null } => {
      setIsGenerating(true);
      setError(null);

      try {
        const barcode =
          format === BarcodeFormat.CODE128B
            ? BarcodeGenerator.generateCode128B(data)
            : BarcodeGenerator.generateEAN13(parseInt(data.slice(0, 6) || "0", 10), parseInt(data.slice(6, 12) || "0", 10));

        return { barcode, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to generate barcode";
        setError(errorMessage);
        return { barcode: null, error: errorMessage };
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  return {
    generateBarcode,
    isGenerating,
    error,
  };
}
