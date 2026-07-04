// ====================================================================
// InventoryManager — Formal Verification Suite
// Covers: State transitions, quantity validation, sale/restock, invariants.
// ====================================================================

import { describe, it, expect } from "vitest";
import { InventoryManager } from "@/domain/services/InventoryManager";
import { InventoryStatus, type ProductVariant, type NonNegativeInteger, type UUID, type ISODate } from "@/shared/types";

const createMockVariant = (overrides: Partial<ProductVariant> = {}): ProductVariant => ({
  id: "00000000-0000-0000-0000-000000000001" as UUID,
  productId: "00000000-0000-0000-0000-000000000001" as UUID,
  sku: "ER-18YW-007-DIA-0001" as never,
  barcode: "0700000000010" as never,
  size: 7 as never,
  material: "18K_YELLOW_GOLD" as never,
  gemstone: "Diamond",
  price: 500000 as never, // $5,000.00
  quantity: 10 as NonNegativeInteger,
  status: InventoryStatus.IN_STOCK,
  images: ["/images/ring-1.jpg"],
  createdAt: "2026-01-01T00:00:00.000Z" as ISODate,
  updatedAt: "2026-01-01T00:00:00.000Z" as ISODate,
  ...overrides,
});

describe("InventoryManager.applyDelta()", () => {
  it("should increase quantity on positive delta", () => {
    const variant = createMockVariant({ quantity: 5 as NonNegativeInteger });
    const [updated] = InventoryManager.applyDelta(variant, 3);
    expect(updated.quantity).toBe(8);
  });

  it("should decrease quantity on negative delta", () => {
    const variant = createMockVariant({ quantity: 10 as NonNegativeInteger });
    const [updated] = InventoryManager.applyDelta(variant, -3);
    expect(updated.quantity).toBe(7);
  });

  it("should never go below zero", () => {
    const variant = createMockVariant({ quantity: 2 as NonNegativeInteger });
    const [updated] = InventoryManager.applyDelta(variant, -5);
    expect(updated.quantity).toBe(0);
  });

  it("should return OUT_OF_STOCK when quantity reaches 0", () => {
    const variant = createMockVariant({ quantity: 3 as NonNegativeInteger });
    const [updated] = InventoryManager.applyDelta(variant, -3);
    expect(updated.status).toBe(InventoryStatus.OUT_OF_STOCK);
  });

  it("should return LOW_STOCK when quantity ≤ 5 and > 0", () => {
    const variant = createMockVariant({ quantity: 10 as NonNegativeInteger });
    const [updated] = InventoryManager.applyDelta(variant, -6);
    expect(updated.status).toBe(InventoryStatus.LOW_STOCK);
  });

  it("should produce a transaction log", () => {
    const variant = createMockVariant();
    const [, transaction] = InventoryManager.applyDelta(variant, -2, "SALE", "Sold 2 rings");
    expect(transaction.type).toBe("SALE");
    expect(transaction.previousQuantity).toBe(10);
    expect(transaction.newQuantity).toBe(8);
    expect(transaction.delta).toBe(-2);
    expect(transaction.note).toBe("Sold 2 rings");
  });
});

describe("InventoryManager.restock()", () => {
  it("should increase quantity", () => {
    const variant = createMockVariant({ quantity: 0 as NonNegativeInteger, status: InventoryStatus.OUT_OF_STOCK });
    const [updated] = InventoryManager.restock(variant, 10);
    expect(updated.quantity).toBe(10);
    expect(updated.status).toBe(InventoryStatus.IN_STOCK);
  });

  it("should reject non-positive restock", () => {
    const variant = createMockVariant();
    expect(() => InventoryManager.restock(variant, 0)).toThrow();
    expect(() => InventoryManager.restock(variant, -5)).toThrow();
  });
});

describe("InventoryManager.recordSale()", () => {
  it("should decrement quantity by 1 by default", () => {
    const variant = createMockVariant();
    const [updated] = InventoryManager.recordSale(variant);
    expect(updated.quantity).toBe(9);
  });

  it("should decrement by custom amount", () => {
    const variant = createMockVariant({ quantity: 20 as NonNegativeInteger });
    const [updated] = InventoryManager.recordSale(variant, 3);
    expect(updated.quantity).toBe(17);
  });

  it("should reject sale exceeding stock", () => {
    const variant = createMockVariant({ quantity: 2 as NonNegativeInteger });
    expect(() => InventoryManager.recordSale(variant, 5)).toThrow();
  });
});

describe("InventoryManager.getInventorySummary()", () => {
  it("should compute correct counts", () => {
    const variants = [
      createMockVariant({ id: "1" as UUID, quantity: 10 as NonNegativeInteger, status: InventoryStatus.IN_STOCK }),
      createMockVariant({ id: "2" as UUID, quantity: 10 as NonNegativeInteger, status: InventoryStatus.IN_STOCK }),
      createMockVariant({ id: "3" as UUID, quantity: 3 as NonNegativeInteger, status: InventoryStatus.LOW_STOCK }),
      createMockVariant({ id: "4" as UUID, quantity: 0 as NonNegativeInteger, status: InventoryStatus.OUT_OF_STOCK }),
      createMockVariant({ id: "5" as UUID, quantity: 0 as NonNegativeInteger, status: InventoryStatus.DISCONTINUED }),
    ];
    const summary = InventoryManager.getInventorySummary(variants);
    expect(summary.total).toBe(5);
    expect(summary.inStock).toBe(2);
    expect(summary.lowStock).toBe(1);
    expect(summary.outOfStock).toBe(1);
    expect(summary.discontinued).toBe(1);
    expect(summary.totalUnits).toBe(23);
  });
});

describe("InventoryManager.validateProposedQuantity()", () => {
  it("should reject negative quantity", () => {
    const variant = createMockVariant();
    const result = InventoryManager.validateProposedQuantity(variant, -1);
    expect(result.valid).toBe(false);
  });

  it("should reject non-integer quantity", () => {
    const variant = createMockVariant();
    const result = InventoryManager.validateProposedQuantity(variant, 5.5);
    expect(result.valid).toBe(false);
  });

  it("should accept valid quantity", () => {
    const variant = createMockVariant();
    const result = InventoryManager.validateProposedQuantity(variant, 15);
    expect(result.valid).toBe(true);
  });
});

describe("InventoryManager.discontinue()", () => {
  it("should mark variant as discontinued with a transaction", () => {
    const variant = createMockVariant();
    const [updated, txn] = InventoryManager.discontinue(variant, "End of line");
    expect(updated.status).toBe(InventoryStatus.DISCONTINUED);
    expect(txn.note).toContain("End of line");
  });

  it("should reject discontinue on already discontinued variant", () => {
    const variant = createMockVariant({ status: InventoryStatus.DISCONTINUED });
    expect(() => InventoryManager.discontinue(variant)).toThrow();
  });
});
