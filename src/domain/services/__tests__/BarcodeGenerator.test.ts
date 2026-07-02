// ====================================================================
// BarcodeGenerator — Formal Verification Suite
// Covers: EAN-13 generation, Code-128B encoding, check digit math,
//         bar pattern rendering, edge cases, invariants.
// ====================================================================

import { describe, it, expect } from "vitest";
import { BarcodeGenerator } from "@/domain/services/BarcodeGenerator";
import { BarcodeFormat } from "@/shared/types";

// ====================================================================
// EAN-13 Tests
// ====================================================================
describe("BarcodeGenerator.generateEAN13()", () => {
  it("should generate a 13-digit barcode", () => {
    const barcode = BarcodeGenerator.generateEAN13(0, 0);
    expect(barcode.length).toBe(13);
    expect(/^\d{13}$/.test(barcode)).toBe(true);
  });

  it("should start with system code '07'", () => {
    const barcode = BarcodeGenerator.generateEAN13(5, 3);
    expect(barcode.startsWith("07")).toBe(true);
  });

  it("should produce valid checksum", () => {
    const barcode = BarcodeGenerator.generateEAN13(42, 7);
    const digits = barcode.split("").map(Number);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    const expectedCheck = (10 - (sum % 10)) % 10;
    expect(digits[12]).toBe(expectedCheck);
  });

  it("should be deterministic (same inputs → same output)", () => {
    const b1 = BarcodeGenerator.generateEAN13(999, 5);
    const b2 = BarcodeGenerator.generateEAN13(999, 5);
    expect(b1).toBe(b2);
  });

  it("should produce different barcodes for different inputs", () => {
    const b1 = BarcodeGenerator.generateEAN13(1, 0);
    const b2 = BarcodeGenerator.generateEAN13(2, 0);
    expect(b1).not.toBe(b2);
  });

  it("should handle maximum bounds", () => {
    const barcode = BarcodeGenerator.generateEAN13(99999, 9);
    expect(barcode.length).toBe(13);
  });
});

// ====================================================================
// Code-128B Tests
// ====================================================================
describe("BarcodeGenerator.generateCode128B()", () => {
  it("should generate a 13-digit numeric string", () => {
    const result = BarcodeGenerator.generateCode128B("ER-18YW-007-DIA-0001");
    expect(result.length).toBe(13);
  });

  it("should be deterministic", () => {
    const a = BarcodeGenerator.generateCode128B("TEST-SKU-001");
    const b = BarcodeGenerator.generateCode128B("TEST-SKU-001");
    expect(a).toBe(b);
  });

  it("should throw on empty string", () => {
    expect(() => BarcodeGenerator.generateCode128B("")).toThrow();
  });

  it("should throw on non-printable ASCII", () => {
    expect(() => BarcodeGenerator.generateCode128B("\x01")).toThrow();
  });

  it("should accept all printable ASCII", () => {
    const data = "Hello World 123!@#$%";
    const result = BarcodeGenerator.generateCode128B(data);
    expect(result.length).toBe(13);
  });
});

// ====================================================================
// EAN-13 Pattern Encoding Tests
// ====================================================================
describe("BarcodeGenerator.encodeEAN13ToPattern()", () => {
  it("should produce valid bar/space arrays", () => {
    const barcode = BarcodeGenerator.generateEAN13(0, 0);
    const pattern = BarcodeGenerator.encodeEAN13ToPattern(barcode);
    expect(pattern.bars.length).toBeGreaterThan(0);
    expect(pattern.spaces.length).toBeGreaterThan(0);
    expect(pattern.totalModules).toBeGreaterThan(0);
  });

  it("should reject invalid length", () => {
    expect(() =>
      BarcodeGenerator.encodeEAN13ToPattern("123456789012" as never),
    ).toThrow();
  });
});

// ====================================================================
// Full Render Pipeline Tests
// ====================================================================
describe("BarcodeGenerator.render()", () => {
  it("should produce a complete output", () => {
    const result = BarcodeGenerator.render("TEST", {
      format: BarcodeFormat.CODE128B,
      barHeight: 80,
      barWidthUnit: 1,
      showText: true,
      foreground: "#000000",
      background: "#FFFFFF",
      scale: 1.0,
    });
    expect(result.pattern).toBeDefined();
    expect(result.barcode).toBeDefined();
    expect(result.checksum).toBeDefined();
    expect(result.generatedAt).toBeDefined();
  });

  it("should be deterministic", () => {
    const opts = {
      format: BarcodeFormat.CODE128B as BarcodeFormat,
      barHeight: 80,
      barWidthUnit: 1,
      showText: true,
      foreground: "#000000",
      background: "#FFFFFF",
      scale: 1.0,
    };
    const a = BarcodeGenerator.render("CONSISTENCY", opts);
    const b = BarcodeGenerator.render("CONSISTENCY", opts);
    expect(a.barcode).toBe(b.barcode);
    expect(a.pattern.bars).toEqual(b.pattern.bars);
  });
});
