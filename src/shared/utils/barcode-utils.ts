// ====================================================================
// Barcode Rendering Utilities
// Converts BarcodePattern → SVG/Canvas rendering data
// ====================================================================

import type { BarcodeRenderOptions, BarcodePattern } from "@/shared/types";

/** SVG element string for a complete barcode */
export function patternToSVG(
  pattern: BarcodePattern,
  options: BarcodeRenderOptions,
): string {
  const modulePixels = options.barWidthUnit * options.scale;
  const height = options.barHeight * options.scale;
  const totalWidth = pattern.totalModules * modulePixels;

  // Build rects for bars only (spaces are implied by absence)
  let x = 0;
  const rects: string[] = [];

  for (let i = 0; i < pattern.bars.length; i++) {
    const barWidth = pattern.bars[i] * modulePixels;
    const spaceWidth = i < pattern.spaces.length ? pattern.spaces[i] * modulePixels : 0;

    if (barWidth > 0) {
      rects.push(
        `<rect x="${x.toFixed(2)}" y="0" width="${barWidth.toFixed(2)}" height="${height.toFixed(2)}" fill="${options.foreground}" />`,
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

/** CSS class for inventory status indicator */
export function getInventoryStatusBadgeClass(status: string): string {
  switch (status) {
    case "IN_STOCK":
      return "badge-luxury bg-emerald-100 text-emerald-800";
    case "LOW_STOCK":
      return "badge-luxury bg-amber-100 text-amber-800";
    case "OUT_OF_STOCK":
      return "badge-luxury bg-rose-100 text-rose-800";
    case "DISCONTINUED":
      return "badge-luxury bg-slate-100 text-slate-500";
    default:
      return "badge-luxury bg-slate-100 text-slate-600";
  }
}

/** Human-readable material name */
export function getMaterialDisplayName(material: string): string {
  const map: Record<string, string> = {
    "18K_YELLOW_GOLD": "18K Yellow Gold",
    "18K_WHITE_GOLD": "18K White Gold",
    "18K_ROSE_GOLD": "18K Rose Gold",
    "24K_GOLD": "24K Gold",
    "PLATINUM": "Platinum",
    "STERLING_SILVER_925": "Sterling Silver 925",
    "TITANIUM": "Titanium",
    "PALLADIUM": "Palladium",
  };
  return map[material] || material;
}
