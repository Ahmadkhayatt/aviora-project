"use client";

import { useMemo } from "react";
import { BarcodeGenerator } from "@/domain/services/BarcodeGenerator";
import { BarcodeFormat, type BarcodeRenderOptions } from "@/shared/types";
import { patternToSVG } from "@/shared/utils/barcode-utils";

export interface BarcodeSVGProps {
  /** The text or SKU to encode */
  readonly data: string;
  /** Barcode format (default: Code-128B) */
  readonly format?: BarcodeFormat;
  /** Bar height in pixels (default: 80) */
  readonly barHeight?: number;
  /** Narrowest bar unit width in pixels (default: 1) */
  readonly barWidthUnit?: number;
  /** Show human-readable text below barcode (default: true) */
  readonly showText?: boolean;
  /** Foreground bar color (default: "#000000") */
  readonly foreground?: string;
  /** Background color (default: "#FFFFFF") */
  readonly background?: string;
  /** Scale factor (default: 1.0) */
  readonly scale?: number;
  /** Additional CSS class names */
  readonly className?: string;
}

/**
 * BarcodeSVG — Renders a deterministic, high-fidelity barcode as an inline SVG.
 *
 * Mathematical pipeline:
 *   data → BarcodeGenerator.render() → BarcodePattern → patternToSVG() → inline SVG
 *
 * All render steps are pure functions with zero side effects.
 * Repetitive renders with identical props produce identical output.
 */
export function BarcodeSVG({
  data,
  format = BarcodeFormat.CODE128B,
  barHeight = 80,
  barWidthUnit = 1,
  showText = true,
  foreground = "#000000",
  background = "#FFFFFF",
  scale = 1.0,
  className = "",
}: BarcodeSVGProps) {
  const options: BarcodeRenderOptions = useMemo(
    () => ({
      format,
      barHeight,
      barWidthUnit,
      showText,
      foreground,
      background,
      scale,
    }),
    [format, barHeight, barWidthUnit, showText, foreground, background, scale],
  );

  const svgMarkup = useMemo(() => {
    try {
      const result = BarcodeGenerator.render(data, options);
      return patternToSVG(result.pattern, options);
    } catch (error) {
      return null;
    }
  }, [data, options]);

  if (!svgMarkup) {
    return (
      <div
        className={`flex items-center justify-center rounded border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-600 ${className}`}
        title={`Failed to encode: ${data}`}
      >
        <span>Invalid barcode data</span>
      </div>
    );
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
      aria-label={`Barcode: ${data}`}
      role="img"
    />
  );
}
