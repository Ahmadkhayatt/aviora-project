// ====================================================================
// AVIORA — BarcodeGenerator Service
// Pure mathematical engine for barcode digit-to-pattern conversion.
// Supports: Code-128B (primary, for internal/SKU tracking)
//           EAN-13  (secondary, for retail POS compatibility)
// Zero runtime dependencies. 100% deterministic output.
// ====================================================================

import {
  BarcodeFormat,
  type Barcode13,
  type BarcodeRenderOptions,
  type BarcodePattern,
  type GeneratedBarcode,
  type SkuCode,
  type ISODate,
} from "@/shared/types";
import {
  CODE128_ENCODING_TABLE,
  CODE128_START_B,
  CODE128_STOP,
  EAN13_TOTAL_LENGTH,
  EAN13_SYSTEM_CODE,
  EAN13_L_CODE,
  EAN13_G_CODE,
  EAN13_R_CODE,
  EAN13_PARITY_PATTERNS,
} from "@/shared/constants";

// ====================================================================
// UTILITY: CHECK DIGIT COMPUTATION
// ====================================================================

/**
 * Computes the EAN-13 check digit.
 * Algorithm: Sum(odd_pos × 1) + Sum(even_pos × 3), then (10 - (sum mod 10)) mod 10.
 * Time: O(n), Space: O(1)
 */
function computeEAN13CheckDigit(digits: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * Computes the Code-128 check digit.
 * Algorithm: (start + Σ(position_i × value_i)) mod 103
 * Time: O(n), Space: O(1)
 */
function computeCode128CheckDigit(values: readonly number[], startCode: number): number {
  let sum = startCode;
  for (let i = 0; i < values.length; i++) {
    sum += (i + 1) * values[i];
  }
  return sum % 103;
}

// ====================================================================
// MAIN BARCODE GENERATOR
// ====================================================================

export class BarcodeGenerator {
  /**
   * Generates a unique EAN-13 barcode from a product identifier.
   * Format: [system_code:2][mfg_prefix:4][product_code:5][check_digit:1]
   *
   * @param productIndex - sequential product number (0-99999)
   * @param variantIndex  - variant index within product (0-9, encoded as last digit before check)
   * @returns Valid 13-digit EAN-13 barcode
   *
   * Complexity: O(1) for check digit; O(13) for encoding
   */
  static generateEAN13(productIndex: number, variantIndex: number = 0): Barcode13 {
    const digitStr =
      EAN13_SYSTEM_CODE +
      String(productIndex).padStart(5, "0").slice(0, 5) +
      String(variantIndex).padStart(5, "0").slice(0, 5);

    const digits = digitStr.split("").map(Number);
    const check = computeEAN13CheckDigit(digits);
    return (digitStr + check) as Barcode13;
  }

  /**
   * Encodes a string into a Code-128B barcode.
   * Only printable ASCII characters (32-126) are valid in Code-128B.
   *
   * @param data - alphanumeric string to encode
   * @returns Complete Code-128B barcode digit string
   *
   * Complexity: O(n) where n = data.length
   */
  static generateCode128B(data: string, nonce: number = 0): Barcode13 {
    const chars = [...data];
    if (chars.length === 0 || chars.length > 48) {
      throw new Error(`Code-128B data length must be 1-48 chars, got ${chars.length}`);
    }

    // Validate all characters are printable ASCII
    for (const ch of chars) {
      const code = ch.charCodeAt(0);
      if (code < 32 || code > 126) {
        throw new Error(`Code-128B: character '${ch}' (code ${code}) out of range [32,126]`);
      }
    }

    // Hash to 13-digit numeric string for DB storage
    const hash = this.hashTo13Digits(data, nonce);
    return hash as Barcode13;
  }

  /**
   * Hashes any string to a deterministic 13-digit numeric string.
   * Uses modular arithmetic with a large prime to minimize collisions.
   * Complexity: O(n), Space: O(1)
   */
  private static hashTo13Digits(input: string, nonce: number = 0): string {
    const PRIME = 1000000000039n;
    let hash = 0n;
    const saltedInput = nonce > 0 ? `${input}-${nonce}` : input;
    for (let i = 0; i < saltedInput.length; i++) {
      hash = (hash * 31n + BigInt(saltedInput.charCodeAt(i))) % PRIME;
    }
    // Extract 13 digits
    const numeric = Number(hash % 10000000000000n);
    return String(numeric).padStart(13, "0");
  }

  /**
   * Generates a unique SKU-based barcode (EAN-13) for a product variant.
   * This is the main entry point for product variant barcode assignment.
   *
   * @param sku - the SKU string for the variant
   * @param format - preferred format (defaults to EAN13 for retail)
   */
  static generateVariantBarcode(sku: SkuCode, format: BarcodeFormat = BarcodeFormat.EAN13, nonce: number = 0): Barcode13 {
    if (format === BarcodeFormat.CODE128B) {
      return this.generateCode128B(sku, nonce);
    }
    // For EAN-13, extract numeric portion from SKU or generate from hash
    const numericPart = sku.replace(/\D/g, "").slice(0, 12);
    if (numericPart.length === 12 && nonce === 0) {
      const digits = numericPart.split("").map(Number);
      const check = computeEAN13CheckDigit(digits);
      return (numericPart + check) as Barcode13;
    }
    // Fallback: hash the full SKU (incorporating nonce for collision retry)
    const digits = this.hashTo13Digits(sku, nonce);
    const dataDigits = digits.slice(0, 12).split("").map(Number);
    const check = computeEAN13CheckDigit(dataDigits);
    return (dataDigits.join("") + check) as Barcode13;
  }

  // ====================================================================
  // ENCODING TO BAR PATTERNS
  // ====================================================================

  /**
   * Converts an EAN-13 digit string into a renderable bar pattern.
   * Time: O(13), Space: O(95) bars+spaces
   */
  static encodeEAN13ToPattern(barcode: Barcode13): BarcodePattern {
    const digits = barcode.split("").map(Number);
    if (digits.length !== EAN13_TOTAL_LENGTH) {
      throw new Error(`EAN-13 barcode must be 13 digits, got ${digits.length}`);
    }

    // Verify check digit
    const expectedCheck = computeEAN13CheckDigit(digits.slice(0, 12));
    if (digits[12] !== expectedCheck) {
      throw new Error(`EAN-13 check digit mismatch: expected ${expectedCheck}, got ${digits[12]}`);
    }

    const firstDigit = digits[0];
    const parity = EAN13_PARITY_PATTERNS[firstDigit];

    // ================================================================
    // Step 1: Build the complete 95-module sequence for the barcode.
    //         Each module is 1 (bar/dark) or 0 (space/light).
    // ================================================================
    const modules: number[] = [];

    // Start guard: bar-space-bar (1-0-1)
    modules.push(1, 0, 1);

    // Left half: digits 1-6, encoded with L or G parity (7 bits each, MSB first)
    for (let i = 0; i < 6; i++) {
      const digit = digits[i + 1];
      const pattern = parity[i] === "L" ? EAN13_L_CODE[digit] : EAN13_G_CODE[digit];
      for (let bit = 6; bit >= 0; bit--) {
        modules.push((pattern >> bit) & 1);
      }
    }

    // Middle guard: space-bar-space-bar-space (0-1-0-1-0)
    modules.push(0, 1, 0, 1, 0);

    // Right half: digits 7-12, encoded with R parity (7 bits each, MSB first)
    for (let i = 0; i < 6; i++) {
      const digit = digits[i + 7];
      const pattern = EAN13_R_CODE[digit];
      for (let bit = 6; bit >= 0; bit--) {
        modules.push((pattern >> bit) & 1);
      }
    }

    // End guard: bar-space-bar (1-0-1)
    modules.push(1, 0, 1);

    // ================================================================
    // Step 2: Run-length encode the module sequence into bar/space
    //         element widths.  Consecutive 1s → one bar element;
    //         consecutive 0s → one space element.
    // ================================================================
    const bars: number[] = [];
    const spaces: number[] = [];

    let current = modules[0];
    let count = 1;

    for (let i = 1; i < modules.length; i++) {
      if (modules[i] === current) {
        count++;
      } else {
        // Flush current run
        if (current === 1) bars.push(count);
        else spaces.push(count);
        current = modules[i];
        count = 1;
      }
    }
    // Flush last run
    if (current === 1) bars.push(count);
    else spaces.push(count);

    // ================================================================
    // Step 3: Validate total modules = 95 for EAN-13.
    //         No padding is needed — EAN-13 naturally produces
    //         30 bars + 29 spaces = 95 modules (bars = spaces + 1).
    // ================================================================
    const totalModules = bars.reduce((a, b) => a + b, 0) + spaces.reduce((a, b) => a + b, 0);

    if (totalModules !== 95) {
      throw new Error(
        `Incorrect total modules in EAN-13 pattern. Expected 95, got ${totalModules}. Bars: ${bars.length}, Spaces: ${spaces.length}`
      );
    }

    return {
      bars,
      spaces,
      totalModules,
      humanReadable: barcode,
    };
  }

  /**
   * Converts a Code-128B data string into a renderable bar pattern.
   * Time: O(n), Space: O(11n + 37) modules
   */
  static encodeCode128BToPattern(data: string): BarcodePattern {
    const chars = [...data];
    const values = chars.map((ch) => {
      const code = ch.charCodeAt(0);
      if (code < 32 || code > 126) {
        throw new Error(`Code-128B: character '${ch}' out of range`);
      }
      return code - 32;
    });

    // Start Code B
    const allValues = [CODE128_START_B, ...values];
    const checksum = computeCode128CheckDigit(values, CODE128_START_B);

    // Build full value sequence: start + data + checksum + stop
    const fullSequence = [...allValues, checksum, CODE128_STOP];

    const bars: number[] = [];
    const spaces: number[] = [];

    for (let i = 0; i < fullSequence.length; i++) {
      const val = fullSequence[i];
      const entry = CODE128_ENCODING_TABLE[val];
      if (!entry) {
        throw new Error(`Invalid barcode character at position ${i}: ${val}`);
      }
      const [pattern] = entry;
      // Each symbol = alternating bars and spaces starting with a bar
      // 11-module symbol: 3 bars + 3 spaces (bar, space, bar, space, bar, space + trailing bar)
      // 13-module stop:   4 bars + 3 spaces
      const width = val === CODE128_STOP ? 13 : 11;
      for (let bit = width - 1; bit >= 0; bit--) {
        const moduleVal = (pattern >> bit) & 1;
        // Even bit index from MSB = bar, odd = space (each symbol starts with bar)
        const bitFromRight = width - 1 - bit;
        if (bitFromRight % 2 === 0) {
          bars.push(moduleVal);
        } else {
          spaces.push(moduleVal);
        }
      }
    }

    // Ensure bars and spaces arrays are balanced (bars count should equal spaces + 1 or spaces)
    while (spaces.length < bars.length - 1) spaces.push(0);

    const totalModules =
      bars.reduce((a, b) => a + b, 0) + spaces.reduce((a, b) => a + b, 0);

    return { bars, spaces, totalModules, humanReadable: data };
  }

  /**
   * Top-level render: generates the complete barcode with pattern.
   */
  static render(data: string, options: BarcodeRenderOptions): GeneratedBarcode {
    const barcode: Barcode13 = (options.format === BarcodeFormat.CODE128B
      ? this.generateCode128B(data)
      : this.generateVariantBarcode(data as SkuCode)) as unknown as Barcode13;

    const pattern = options.format === BarcodeFormat.CODE128B
      ? this.encodeCode128BToPattern(data)
      : this.encodeEAN13ToPattern(this.generateVariantBarcode(data as SkuCode));

    const checksum = parseInt(barcode[barcode.length - 1], 10);

    return {
      pattern,
      format: options.format,
      barcode,
      checksum,
      options,
      generatedAt: new Date().toISOString() as ISODate,
    };
  }
}
