// ====================================================================
// AVIORA — InventoryTracking Use Case
// Application-level orchestration for inventory operations
// ====================================================================

import { InventoryStatus } from "@/shared/types";
import type { ProductVariant, InventoryTransaction } from "@/shared/types";
import { InventoryManager } from "@/domain/services/InventoryManager";

export interface InventorySummary {
  readonly totalVariants: number;
  readonly totalUnits: number;
  readonly lowStockCount: number;
  readonly outOfStockCount: number;
  readonly statusCounts: Readonly<Record<InventoryStatus, number>>;
}

export interface RestockRequest {
  readonly variantId: string;
  readonly quantity: number;
  readonly note?: string;
}

export interface InventoryFilters {
  readonly status?: InventoryStatus;
  readonly material?: string;
  readonly size?: string;
  readonly gemstone?: string;
  readonly searchTerm?: string;
}

export class InventoryTrackingUseCase {
  private constructor() {} // Static only

  /**
   * Retrieve all variants with optional filtering
   * Time: O(n) where n = all variants
   * Space: O(k) where k = filtered result size
   */
  static getAllVariants(_filters?: InventoryFilters): readonly ProductVariant[] {
    // In production, this would fetch from database via repository
    // For demo, we rely on in-memory store
    throw new Error("Implement fetch mechanism via repository pattern");
  }

  /**
   * Get a single variant by ID
   * Time: O(n) linear search
   * Space: O(1)
   */
  static getVariantById(_id: string): ProductVariant | undefined {
    // Implement fetch mechanism via repository pattern
    throw new Error("Implement fetch mechanism via repository pattern");
  }

  /**
   * Get dashboard summary statistics
   * Time: O(n) where n = all variants
   * Space: O(1)
   */
  static getSummary(): InventorySummary {
    const variants = this.getAllVariants();
    const statusCounts: Record<InventoryStatus, number> = {
      [InventoryStatus.IN_STOCK]: 0,
      [InventoryStatus.LOW_STOCK]: 0,
      [InventoryStatus.OUT_OF_STOCK]: 0,
      [InventoryStatus.DISCONTINUED]: 0,
    };

    let totalUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const variant of variants) {
      totalUnits += variant.quantity;
      statusCounts[variant.status] = (statusCounts[variant.status] || 0) + 1;

      if (variant.status === InventoryStatus.LOW_STOCK) lowStockCount++;
      if (variant.status === InventoryStatus.OUT_OF_STOCK) outOfStockCount++;
    }

    return {
      totalVariants: variants.length,
      totalUnits,
      lowStockCount,
      outOfStockCount,
      statusCounts,
    };
  }

  /**
   * Get variants that are low on stock
   * Time: O(n) where n = all variants
   * Space: O(l) where l = low stock count
   */
  static getLowStock(): readonly ProductVariant[] {
    return this.getAllVariants().filter((v) => v.status === InventoryStatus.LOW_STOCK);
  }

  /**
   * Get variants that are out of stock
   * Time: O(n) where n = all variants
   * Space: O(o) where o = out of stock count
   */
  static getOutOfStock(): readonly ProductVariant[] {
    return this.getAllVariants().filter((v) => v.status === InventoryStatus.OUT_OF_STOCK);
  }

  /**
   * Filter variants by inventory status
   * Time: O(n) where n = all variants
   * Space: O(f) where f = filtered result size
   */
  static getByStatus(status: InventoryStatus): readonly ProductVariant[] {
    return this.getAllVariants().filter((v) => v.status === status);
  }

  /**
   * Restock inventory for a variant
   * Time: O(n) where n = all variants (for finding variant)
   * Space: O(1)
   */
  static restock(request: RestockRequest): ProductVariant {
    const variant = this.getVariantById(request.variantId);
    if (!variant) {
      throw new Error(`Variant not found: ${request.variantId}`);
    }

    const [updatedVariant] = InventoryManager.restock(variant, request.quantity, request.note || `Restocked by admin - ${new Date().toISOString()}`);

    // In production: save to database
    // this.repository.saveVariant(updatedVariant);

    return updatedVariant;
  }

  /**
   * Update variant quantity (admin adjustment)
   * Time: O(n) where n = all variants (for finding variant)
   * Space: O(1)
   */
  static updateQuantity(_variantId: string, newQuantity: number, note: string = "Admin adjustment"): ProductVariant {
    const variant = this.getVariantById(_variantId);
    if (!variant) {
      throw new Error(`Variant not found: ${_variantId}`);
    }

    const delta = newQuantity - variant.quantity;
    if (delta === 0) {
      return variant; // No change
    }

    const [updatedVariant] = InventoryManager.applyDelta(variant, delta, "ADJUSTMENT", note);

    // In production: save to database
    // this.repository.saveVariant(updatedVariant);

    return updatedVariant;
  }

  /**
   * Get transaction history for a specific variant
   * Time: O(t) where t = transactions (for filtering)
   * Space: O(h) where h = history length
   */
  static getTransactionsForVariant(_variantId: string): readonly InventoryTransaction[] {
    // In production: fetch from transaction log via repository
    // For demo, we rely on in-memory store
    throw new Error("Implement fetch mechanism via repository pattern");
  }

  /**
   * Get transaction log (admin audit trail)
   * Time: O(t) where t = all transactions
   * Space: O(t)
   */
  static getTransactionLog(): readonly InventoryTransaction[] {
    // In production: fetch from transaction log via repository
    throw new Error("Implement fetch mechanism via repository pattern");
  }
}