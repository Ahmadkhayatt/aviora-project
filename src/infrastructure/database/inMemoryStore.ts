// ====================================================================
// In-Memory Data Store
// Temporary store for demo/development. Swap with Prisma + Postgres
// when moving to production. Follows the same interface contract.
// ====================================================================

import {
  type Product,
  type ProductVariant,
  type ProductFormData,
  type InventoryTransaction,
  type UUID,
  type NonNegativeInteger,
  type ISODate,
  type DashboardSummary,
  InventoryStatus,
  JewelryMaterial,
  RingSize,
} from "@/shared/types";
import { SKU } from "@/domain/value-objects/SKU";
import { BarcodeGenerator } from "@/domain/services/BarcodeGenerator";

// ====================================================================
// MUTEX-LIKE SAFETY: All mutations create new references (immutable updates)
// ====================================================================

class InMemoryStore {
  private products: Map<UUID, Product> = new Map();
  private variants: Map<UUID, ProductVariant> = new Map();
  private transactions: InventoryTransaction[] = [];
  private seqCounter = 0;

  // ---- Products ----

  getAllProducts(): Product[] {
    return Array.from(this.products.values());
  }

  getProductById(id: UUID): Product | undefined {
    return this.products.get(id);
  }

  getProductBySlug(slug: string): Product | undefined {
    return Array.from(this.products.values()).find((p) => p.slug === slug);
  }

  createProduct(data: ProductFormData): Product {
    this.seqCounter++;
    const id = crypto.randomUUID() as UUID;
    const now = new Date().toISOString() as ISODate;
    const slugs = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const product: Product = {
      id,
      name: data.name,
      slug: `${slugs}-${this.seqCounter}`,
      description: data.description,
      category: data.category,
      basePrice: data.basePrice as never,
      availableSizes: data.availableSizes,
      availableMaterials: data.availableMaterials,
      availableGemstones: data.availableGemstones,
      variants: [],
      coverImage: data.coverImage || "/images/placeholder.svg",
      images: data.images,
      isFeatured: data.isFeatured,
      createdAt: now,
      updatedAt: now,
    };

    this.products.set(id, product);
    return product;
  }

  updateProduct(id: UUID, data: Partial<ProductFormData>): Product | undefined {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updated: Product = {
      ...product,
      ...(data.name && { name: data.name, slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") }),
      ...(data.description && { description: data.description }),
      ...(data.category && { category: data.category }),
      ...(data.basePrice && { basePrice: data.basePrice as never }),
      ...(data.availableSizes && { availableSizes: data.availableSizes }),
      ...(data.availableMaterials && { availableMaterials: data.availableMaterials }),
      ...(data.availableGemstones && { availableGemstones: data.availableGemstones }),
      ...(data.coverImage && { coverImage: data.coverImage }),
      ...(data.images && { images: data.images }),
      ...(typeof data.isFeatured === "boolean" && { isFeatured: data.isFeatured }),
      updatedAt: new Date().toISOString() as ISODate,
    };

    this.products.set(id, updated);
    return updated;
  }

  deleteProduct(id: UUID): boolean {
    return this.products.delete(id);
  }

  // ---- Variants ----

  createVariant(
    productId: UUID,
    size: RingSize,
    material: JewelryMaterial,
    gemstone?: string,
    price?: number,
    quantity?: number,
  ): ProductVariant | undefined {
    const product = this.products.get(productId);
    if (!product) return undefined;

    this.seqCounter++;
    const id = crypto.randomUUID() as UUID;
    const sku = SKU.generate(
      product.category,
      material,
      size,
      gemstone,
      this.seqCounter as NonNegativeInteger,
    );
    const barcode = BarcodeGenerator.generateVariantBarcode(sku);

    const variant: ProductVariant = {
      id,
      productId,
      sku,
      barcode,
      size,
      material,
      gemstone,
      price: (price || product.basePrice) as never,
      quantity: (quantity ?? 0) as NonNegativeInteger,
      status: (quantity ?? 0) > 0 ? InventoryStatus.IN_STOCK : InventoryStatus.OUT_OF_STOCK,
      images: [],
      createdAt: new Date().toISOString() as ISODate,
      updatedAt: new Date().toISOString() as ISODate,
    };

    this.variants.set(id, variant);
    // Update product's variant list
    const updatedProduct: Product = {
      ...product,
      variants: [...product.variants, variant],
      updatedAt: new Date().toISOString() as ISODate,
    };
    this.products.set(productId, updatedProduct);

    return variant;
  }

  updateVariantQuantity(variantId: UUID, newQuantity: number): ProductVariant | undefined {
    const variant = this.variants.get(variantId);
    if (!variant) return undefined;

    const qty = Math.max(0, newQuantity) as NonNegativeInteger;
    const status =
      qty > 5 ? InventoryStatus.IN_STOCK :
      qty > 0 ? InventoryStatus.LOW_STOCK :
      InventoryStatus.OUT_OF_STOCK;

    const updated: ProductVariant = {
      ...variant,
      quantity: qty,
      status,
      updatedAt: new Date().toISOString() as ISODate,
    };

    this.variants.set(variantId, updated);
    return updated;
  }

  // ---- Dashboard ----

  getDashboardSummary(): DashboardSummary {
    const allVariants = Array.from(this.variants.values());
    let totalInventoryUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const v of allVariants) {
      totalInventoryUnits += v.quantity;
      if (v.status === InventoryStatus.LOW_STOCK) lowStockCount++;
      if (v.status === InventoryStatus.OUT_OF_STOCK) outOfStockCount++;
    }

    return {
      totalProducts: this.products.size,
      totalVariants: this.variants.size,
      totalInventoryUnits,
      lowStockCount,
      outOfStockCount,
      recentTransactions: this.transactions.slice(-20),
    };
  }
}

// Singleton instance
export const store = new InMemoryStore();
