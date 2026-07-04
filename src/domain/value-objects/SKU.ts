// ====================================================================
// AVIORA — SKU Value Object
// Mathematical combinatorics for product variant SKU generation.
// Format: CATEGORY_CODE-MATERIAL_CODE-SIZE-GEMSTONE_CODE-SEQ
// Example: ER-18YW-7-DIA-0001  (Engagement Ring, 18K Yellow Gold, US7, Diamond, seq 0001)
//
// PRODUCT VARIANT COMBINATORICS:
//   For a product with S sizes, M materials, G gemstones:
//   Total variants = S × M × max(1, G)
//   Each variant gets a unique, deterministic SKU.
// ====================================================================

import type { SkuCode, NonNegativeInteger } from "@/shared/types";
import { JewelryMaterial, ProductCategory, RingSize } from "@/shared/types";

// ====================================================================
// SKU PARSING / VALIDATION
// ====================================================================

const CATEGORY_MAP: Record<ProductCategory, string> = {
  [ProductCategory.ENGAGEMENT_RING]: "ER",
  [ProductCategory.WEDDING_BAND]:   "WB",
  [ProductCategory.ETERNITY_BAND]:  "EB",
  [ProductCategory.COCKTAIL_RING]: "CR",
  [ProductCategory.SIGNET_RING]:    "SR",
  [ProductCategory.NECKLACE]:        "NK",
  [ProductCategory.BRACELET]:       "BR",
  [ProductCategory.EARRINGS]:        "EA",
  [ProductCategory.PENDANT]:         "PD",
};

const MATERIAL_MAP: Record<JewelryMaterial, string> = {
  [JewelryMaterial.GOLD_18K_YELLOW]: "18YW",
  [JewelryMaterial.GOLD_18K_WHITE]:  "18WW",
  [JewelryMaterial.GOLD_18K_ROSE]:   "18WR",
  [JewelryMaterial.GOLD_24K]:        "24YG",
  [JewelryMaterial.PLATINUM]:        "PLAT",
  [JewelryMaterial.SILVER_925]:       "925S",
  [JewelryMaterial.TITANIUM]:         "TITN",
  [JewelryMaterial.PALLADIUM]:        "PALL",
};

export class SKU {
  /** Generates a deterministic SKU for a product variant */
  static generate(
    category: ProductCategory,
    material: JewelryMaterial,
    size: RingSize,
    gemstone: string | undefined,
    sequence: NonNegativeInteger,
  ): SkuCode {
    const cat = CATEGORY_MAP[category];
    const mat = MATERIAL_MAP[material];
    const siz = String(size).replace(".", "_").padStart(3, "0");
    const gem = gemstone ? gemstone.slice(0, 4).toUpperCase() : "NOG";
    const seq = String(sequence).padStart(4, "0");
    return `${cat}-${mat}-${siz}-${gem}-${seq}` as SkuCode;
  }

  /** Validates SKU format */
  static isValid(sku: string): boolean {
    return /^[A-Z]{2}-\d{2,3}[A-Z]{2,3}-\d{2,3}-[A-Z0-9]{3,4}-\d{4}$/.test(sku);
  }

  /** Returns total possible variant count for a product configuration */
  static computeVariantCount(
    sizeCount: number,
    materialCount: number,
    gemstoneCount: number,
  ): number {
    return sizeCount * materialCount * Math.max(1, gemstoneCount);
  }
}
