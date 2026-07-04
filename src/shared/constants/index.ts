// ====================================================================
// AVIORA — Shared Constants
// Immutable configuration values. Modify only via architecture review.
// ====================================================================

import type { BarcodeRenderOptions, Code128Encoding, NonNegativeInteger } from "@/shared/types";
import { BarcodeFormat, InventoryStatus } from "@/shared/types";

// ---- Inventory Thresholds ----
export const LOW_STOCK_THRESHOLD: NonNegativeInteger = 5 as NonNegativeInteger;
export const OUT_OF_STOCK_THRESHOLD: NonNegativeInteger = 0 as NonNegativeInteger;

// ---- Barcode Defaults ----
export const DEFAULT_BARCODE_OPTIONS: BarcodeRenderOptions = {
  format: BarcodeFormat.CODE128B,
  barHeight: 80,
  barWidthUnit: 1,
  showText: true,
  foreground: "#000000",
  background: "#FFFFFF",
  scale: 1.0,
};

// ---- EAN-13 Constants ----
export const EAN13_LENGTH = 12; // data digits (before check digit)
export const EAN13_TOTAL_LENGTH = 13;
export const EAN13_SYSTEM_CODE = "07"; // internal use prefix

// ---- Code-128 Constants ----
export const CODE128_START_B = 104;
export const CODE128_STOP = 106;
export const CODE128_QUIET_ZONE = 10; // modules

// ====================================================================
// Code-128B Encoding Table
// Each entry: [bar_pattern_11_bits_value, character_ASCII_value]
// The 11-bit pattern encodes 3 bars + 3 spaces (right-justified in 11 bits)
// Start Code B = 104, Stop = 106
// ====================================================================
export const CODE128_ENCODING_TABLE: readonly Code128Encoding[] = [
  [0b11011001100,   0], [0b11001101100,   1], [0b11001100110,   2],
  [0b10010011000,   3], [0b10010001100,   4], [0b10001001100,   5],
  [0b10011001000,   6], [0b10011000100,   7], [0b10001100100,   8],
  [0b11001001000,   9], [0b11001000100,  10], [0b11000100100,  11],
  [0b10110011100,  12], [0b10011011100,  13], [0b10011001110,  14],
  [0b10111001100,  15], [0b10011101100,  16], [0b10011100110,  17],
  [0b11001110010,  18], [0b11001011100,  19], [0b11001001110,  20],
  [0b11011100100,  21], [0b11001110100,  22], [0b11101101110,  23],
  [0b11101001100,  24], [0b11100101100,  25], [0b11100100110,  26],
  [0b11101100100,  27], [0b11100110100,  28], [0b11100110010,  29],
  [0b11011011000,  30], [0b11011000110,  31], [0b11000110110,  32],
  [0b10100011000,  33], [0b10001011000,  34], [0b10001000110,  35],
  [0b10110001000,  36], [0b10001101000,  37], [0b10001100010,  38],
  [0b11010001000,  39], [0b11000101000,  40], [0b11000100010,  41],
  [0b10110111000,  42], [0b10110001110,  43], [0b10001101110,  44],
  [0b10111011000,  45], [0b10111000110,  46], [0b10001110110,  47],
  [0b11101110110,  48], [0b11010001110,  49], [0b11000101110,  50],
  [0b11011101000,  51], [0b11011100010,  52], [0b11011101110,  53],
  [0b11101011000,  54], [0b11101000110,  55], [0b11100010110,  56],
  [0b11101101000,  57], [0b11101100010,  58], [0b11100011010,  59],
  [0b11101111010,  60], [0b11001000010,  61], [0b11110001010,  62],
  [0b10100110000,  63], [0b10100001100,  64], [0b10010110000,  65],
  [0b10010000110,  66], [0b10000101100,  67], [0b10000100110,  68],
  [0b10110010000,  69], [0b10110000100,  70], [0b10011010000,  71],
  [0b10011000010,  72], [0b10000110100,  73], [0b10000110010,  74],
  [0b11000010010,  75], [0b11001010000,  76], [0b11110111010,  77],
  [0b11000010100,  78], [0b10001111010,  79], [0b10100111100,  80],
  [0b10010111100,  81], [0b10010011110,  82], [0b10111100100,  83],
  [0b10011110100,  84], [0b10011110010,  85], [0b11110100100,  86],
  [0b11110010100,  87], [0b11110010010,  88], [0b11011011110,  89],
  [0b11011110110,  90], [0b11110110110,  91], [0b10101111000,  92],
  [0b10100011110,  93], [0b10001011110,  94], [0b10111101000,  95],
  [0b10111100010,  96], [0b11110101000,  97], [0b11110100010,  98],
  [0b10111011110,  99], [0b10111101110, 100], [0b11101011110, 101],
  [0b11110101110, 102],
  // Start Code A
  [0b11010000100, 103],
  // Start Code B
  [0b11010010000, 104],
  // Start Code C (not used in Code-128B, but needed for table alignment)
  [0b11010011100, 105],
  // Stop — 13 modules wide (value 106)
  [0b1100011101011, 106],
];

// ====================================================================
// EAN-13 Encoding Tables
// L-code (left odd), G-code (left even), R-code (right)
// ====================================================================
export const EAN13_L_CODE: readonly number[] = [
  0b0001101, 0b0011001, 0b0010011, 0b0111101, 0b0100011,
  0b0110001, 0b0101111, 0b0111011, 0b0110111, 0b0001011,
];

export const EAN13_G_CODE: readonly number[] = [
  0b0100111, 0b0110011, 0b0011011, 0b0100001, 0b0011101,
  0b0111001, 0b0000101, 0b0010001, 0b0001001, 0b0010111,
];

export const EAN13_R_CODE: readonly number[] = [
  0b1110010, 0b1100110, 0b1101100, 0b1000010, 0b1011100,
  0b1001110, 0b1010000, 0b1000100, 0b1001000, 0b1110100,
];

/** Parity patterns for left-half, indexed by first digit (0-9) */
export const EAN13_PARITY_PATTERNS: readonly string[] = [
  "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL",
];

// ---- State Machine Transition Map ----
export const INVENTORY_TRANSITIONS: Record<InventoryStatus, readonly InventoryStatus[]> = {
  [InventoryStatus.IN_STOCK]:       [InventoryStatus.LOW_STOCK, InventoryStatus.OUT_OF_STOCK, InventoryStatus.DISCONTINUED],
  [InventoryStatus.LOW_STOCK]:      [InventoryStatus.IN_STOCK, InventoryStatus.OUT_OF_STOCK, InventoryStatus.DISCONTINUED],
  [InventoryStatus.OUT_OF_STOCK]:   [InventoryStatus.IN_STOCK, InventoryStatus.LOW_STOCK, InventoryStatus.DISCONTINUED],
  [InventoryStatus.DISCONTINUED]:   [], // terminal state
};

// ---- Pagination Defaults ----
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;

// ---- Brand Constants ----
export const BRAND_NAME = "AVIORA";
export const BRAND_TAGLINE = "Timeless Elegance, Crafted to Perfection";
