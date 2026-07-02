// ====================================================================
// AVIORA — Shared Type Definitions
// Central type contract for the entire codebase.
// Every module must conform to these contracts. No exceptions.
// ====================================================================

// ---- Primitive Value Types ----
export type Barcode13 = string & { readonly _brand: "Barcode13" };
export type SkuCode = string & { readonly _brand: "SkuCode" };
export type UUID = string & { readonly _brand: "UUID" };
export type ISODate = string & { readonly _brand: "ISODate" };
export type NonNegativeInteger = number & { readonly _brand: "NonNegativeInteger" };
export type PriceCents = number & { readonly _brand: "PriceCents" };

// ---- Enums ----

/** Inventory lifecycle state machine states */
export enum InventoryStatus {
  IN_STOCK = "IN_STOCK",
  LOW_STOCK = "LOW_STOCK",       // ≤ reorder threshold
  OUT_OF_STOCK = "OUT_OF_STOCK", // quantity === 0
  DISCONTINUED = "DISCONTINUED",
}

/** Allowed barcode symbologies */
export enum BarcodeFormat {
  EAN13 = "EAN13",
  CODE128B = "CODE128B",
}

/** Material enum for jewelry */
export enum JewelryMaterial {
  GOLD_18K_YELLOW = "18K_YELLOW_GOLD",
  GOLD_18K_WHITE = "18K_WHITE_GOLD",
  GOLD_18K_ROSE = "18K_ROSE_GOLD",
  GOLD_24K = "24K_GOLD",
  PLATINUM = "PLATINUM",
  SILVER_925 = "STERLING_SILVER_925",
  TITANIUM = "TITANIUM",
  PALLADIUM = "PALLADIUM",
}

/** Ring size standard */
export enum RingSize {
  US_4 = 4,  US_4_5 = 4.5,  US_5 = 5,  US_5_5 = 5.5,
  US_6 = 6,  US_6_5 = 6.5,  US_7 = 7,  US_7_5 = 7.5,
  US_8 = 8,  US_8_5 = 8.5,  US_9 = 9,  US_9_5 = 9.5,
  US_10 = 10, US_10_5 = 10.5, US_11 = 11, US_11_5 = 11.5,
  US_12 = 12, US_13 = 13, US_14 = 14,
}

/** Product categories */
export enum ProductCategory {
  ENGAGEMENT_RING = "ENGAGEMENT_RING",
  WEDDING_BAND = "WEDDING_BAND",
  ETERNITY_BAND = "ETERNITY_BAND",
  COCKTAIL_RING = "COCKTAIL_RING",
  SIGNET_RING = "SIGNET_RING",
  NECKLACE = "NECKLACE",
  BRACELET = "BRACELET",
  EARRINGS = "EARRINGS",
  PENDANT = "PENDANT",
}

// ---- Entity Interfaces ----

/** A sellable product variant (SKU) — the atomic inventory unit */
export interface ProductVariant {
  readonly id: UUID;
  readonly productId: UUID;
  readonly sku: SkuCode;
  readonly barcode: Barcode13;
  readonly size: RingSize;
  readonly material: JewelryMaterial;
  readonly gemstone?: string;           // e.g. "Diamond", "Sapphire", undefined = no gem
  readonly price: PriceCents;
  readonly quantity: NonNegativeInteger;
  readonly status: InventoryStatus;
  readonly images: readonly string[];
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
}

/** The parent product catalog entry */
export interface Product {
  readonly id: UUID;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly category: ProductCategory;
  readonly basePrice: PriceCents;
  readonly availableSizes: readonly RingSize[];
  readonly availableMaterials: readonly JewelryMaterial[];
  readonly availableGemstones: readonly string[];
  readonly variants: readonly ProductVariant[];
  readonly coverImage: string;
  readonly images: readonly string[];
  readonly isFeatured: boolean;
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
}

/** Inventory change log entry */
export interface InventoryTransaction {
  readonly id: UUID;
  readonly variantId: UUID;
  readonly type: "SALE" | "RESTOCK" | "ADJUSTMENT" | "RESERVATION" | "RELEASE";
  readonly delta: number;               // positive = add, negative = remove
  readonly previousQuantity: NonNegativeInteger;
  readonly newQuantity: NonNegativeInteger;
  readonly note: string;
  readonly timestamp: ISODate;
}

/** Barcode rendering parameters */
export interface BarcodeRenderOptions {
  readonly format: BarcodeFormat;
  readonly barHeight: number;           // pixels
  readonly barWidthUnit: number;        // width of narrowest bar in px
  readonly showText: boolean;
  readonly foreground: string;          // hex color
  readonly background: string;          // hex color
  readonly scale: number;               // multiplicative scale factor ≥ 1.0
}

/** Admin dashboard summary */
export interface DashboardSummary {
  readonly totalProducts: number;
  readonly totalVariants: number;
  readonly totalInventoryUnits: number;
  readonly lowStockCount: number;
  readonly outOfStockCount: number;
  readonly recentTransactions: readonly InventoryTransaction[];
}

/** Form input for creating/editing a product */
export interface ProductFormData {
  name: string;
  description: string;
  category: ProductCategory;
  basePrice: number;
  availableSizes: RingSize[];
  availableMaterials: JewelryMaterial[];
  availableGemstones: string[];
  coverImage: string;
  images: string[];
  isFeatured: boolean;
}

/** Form input for variant management */
export interface VariantFormData {
  sku: string;
  barcode: string;
  size: RingSize;
  material: JewelryMaterial;
  gemstone?: string;
  price: number;
  quantity: number;
}

// ---- Barcode Mathematical Types ----

/** Code-128 character encoding: [bar_pattern_11_bits, value] */
export type Code128Encoding = [pattern: number, value: number];

/** EAN-13 parity encoding for left-half digits */
export type EAN13Parity = "LLLLLL" | "LLGLGG" | "LLGGLG" | "LLGGGL" | "LGLLGG" | "LGGLLG" | "LGGGLL" | "LGLGLG" | "LGLGGL" | "LGGLGL";

/** Rendered barcode: raw bar/space widths for canvas or SVG */
export interface BarcodePattern {
  readonly bars: readonly number[];
  readonly spaces: readonly number[];
  readonly totalModules: number;
  readonly humanReadable: string;
}

/** Complete barcode generation output */
export interface GeneratedBarcode {
  readonly pattern: BarcodePattern;
  readonly format: BarcodeFormat;
  readonly barcode: Barcode13;
  readonly checksum: number;
  readonly options: BarcodeRenderOptions;
  readonly generatedAt: ISODate;
}

// ---- API Response Wrappers ----
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly timestamp: ISODate;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
}
