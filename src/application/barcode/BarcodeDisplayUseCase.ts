// ====================================================================
// AVIORA — BarcodeDisplay Use Case
// Application-level orchestration for barcode display and generation
// ====================================================================

import type { Barcode13, BarcodePattern, BarcodeRenderOptions, SkuCode } from "@/shared/types";
import { BarcodeFormat } from "@/shared/types";
import { BarcodeGenerator } from "@/domain/services/BarcodeGenerator";

export interface BarcodeDisplayState {
  readonly barcode: Barcode13;
  readonly format: BarcodeFormat;
  readonly rendering: BarcodeRenderOptions;
  readonly svgMarkup?: string;
  readonly isValid: boolean;
}

export interface BulkGenerationResult {
  readonly sku: string;
  readonly barcode: Barcode13;
  readonly format: BarcodeFormat;
  readonly success: boolean;
  readonly error?: string;
}

export class BarcodeDisplayUseCase {
  private constructor() {} // Static only

  /**
   * Generate a barcode for a given SKU and format
   * Time: O(n) where n = SKU length
   * Space: O(1)
   */
  static generateForSku(sku: string, format: BarcodeFormat = BarcodeFormat.EAN13): Barcode13 {
    if (!sku || sku.trim().length === 0) {
      throw new Error("SKU cannot be empty");
    }

    try {
      return BarcodeGenerator.generateVariantBarcode(sku as SkuCode, format);
    } catch (error) {
      // Fallback to hash-based generation for invalid SKUs
      const fallbackSku = sku.length >= 12 ? sku.substring(0, 12) : "0000000000";
      return BarcodeGenerator.generateEAN13(parseInt(fallbackSku), 0) as unknown as Barcode13;
    }
  }

  /**
   * Generate multiple barcodes from a list of SKUs
   * Time: O(total SKU length)
   * Space: O(n) where n = number of SKUs
   */
  static generateBulk(skus: readonly string[], format: BarcodeFormat = BarcodeFormat.EAN13): BulkGenerationResult[] {
    if (!skus || skus.length === 0) {
      return [];
    }

    return skus.map((sku) => {
      try {
        const barcode = this.generateForSku(sku, format);
        return {
          sku,
          barcode,
          format,
          success: true,
        };
      } catch (error) {
        return {
          sku,
          barcode: "" as unknown as Barcode13,
          format,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });
  }

  /**
   * Generate a renderable barcode display state
   * Time: O(n) for encoding + O(m) for SVG generation
   * Space: O(1) for internal state
   */
  static generateDisplay(sku: string, format: BarcodeFormat = BarcodeFormat.EAN13, options?: Partial<BarcodeRenderOptions>): BarcodeDisplayState {
    const rendered = BarcodeGenerator.render(sku, {
      format,
      barHeight: 80,
      barWidthUnit: 1,
      showText: true,
      foreground: "#000000",
      background: "#FFFFFF",
      scale: 1.0,
      ...options,
    });

    return {
      barcode: rendered.barcode,
      format: rendered.format,
      rendering: rendered.options,
      svgMarkup: rendered.pattern ? this.encodePatternToSvg(rendered.pattern, rendered.options) : undefined,
      isValid: this.validate(rendered.barcode),
    };
  }

  /**
   * Validate a barcode according to format rules
   * Time: O(n) where n = barcode length
   * Space: O(1)
   */
  static validate(barcode: string): boolean {
    if (!barcode || barcode.length !== 13) {
      return false;
    }

    if (!/^\d{13}$/.test(barcode)) {
      return false;
    }

    const digits = barcode.split('').map(Number);
    const checkDigit = digits[12];
    const sum = digits.slice(0, 12).reduce((acc, digit, index) => {
      const weight = (index % 2 === 0) ? 1 : 3;
      return acc + digit * weight;
    }, 0);

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return checkDigit === calculatedCheck;
  }

  /**
   * Convert barcode pattern to SVG markup
   */
  private static encodePatternToSvg(pattern: BarcodePattern, options: BarcodeRenderOptions): string {
    const modulePixels = options.barWidthUnit * options.scale;
    const height = options.barHeight * options.scale;
    const totalWidth = pattern.totalModules * modulePixels;

    let x = 0;
    const rects: string[] = [];

    for (let i = 0; i < pattern.bars.length; i++) {
      const barWidth = pattern.bars[i] * modulePixels;
      const spaceWidth = i < pattern.spaces.length ? pattern.spaces[i] * modulePixels : 0;

      if (barWidth > 0) {
        rects.push(
          `<rect x="${x.toFixed(2)}" y="0" width="${barWidth.toFixed(2)}" height="${height.toFixed(2)}" fill="${options.foreground}" />`
        );
      }
      x += barWidth + spaceWidth;
    }

    const textSvg = options.showText
      ? `<text x="${(totalWidth / 2).toFixed(2)}" y="${(height + 20).toFixed(2)}" font-family="monospace" font-size="14" text-anchor="middle" fill="${options.foreground}">${pattern.humanReadable}</text>`
      : "";

    const padding = 10 * options.scale;
    const totalHeight = options.showText ? height + 40 : height + 20;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
      <rect width="100%" height="100%" fill="${options.background}" />
      <g transform="translate(0, ${padding})">
        ${rects.join("\n      ")}
      </g>
      ${textSvg}
    </svg>`;
  }

  /**
   * Batch validation of multiple barcodes
   * Time: O(n) where n = number of barcodes
   */
  static validateBatch(barcodes: readonly string[]): { readonly valid: Barcode13[]; readonly invalid: string[] } {
    const valid: Barcode13[] = [];
    const invalid: string[] = [];

    for (const barcode of barcodes) {
      if (this.validate(barcode)) {
        valid.push(barcode as Barcode13);
      } else {
        invalid.push(barcode);
      }
    }

    return { valid, invalid };
  }
}