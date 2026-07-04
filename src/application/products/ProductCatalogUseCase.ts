// ====================================================================
// AVIORA — ProductCatalog Use Case
// Application-level orchestration for catalog operations
// ====================================================================

import type { Product, ProductCategory, RingSize, JewelryMaterial } from "@/shared/types";

export interface ProductFilter {
  readonly category?: ProductCategory;
  readonly material?: JewelryMaterial;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly gemstone?: string;
  readonly size?: RingSize;
  readonly searchTerm?: string;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
}

export class ProductCatalogUseCase {
  private constructor() {} // Static only

  /**
   * Retrieve all products from the catalog
   * Time: O(n) where n = number of products
   * Space: O(n)
   */
  static getAll(): readonly Product[] {
    // In production, this would fetch from database via repository
    // For demo, we rely on in-memory store
    throw new Error("Implement fetch mechanism via repository pattern");
  }

  /**
   * Find a product by its UUID
   * Time: O(n) linear search
   * Space: O(1)
   */
  static getById(_id: string): Product | undefined {
    throw new Error("Implement fetch mechanism via repository pattern");
  }

  /**
   * Find product by SEO-friendly slug
   * Time: O(n) linear search
   * Space: O(1)
   */
  static getBySlug(_slug: string): Product | undefined {
    throw new Error("Implement fetch mechanism via repository pattern");
  }

  /**
   * Paginated query for product catalog with optional filtering
   * Time: O(n) where n = filtered result size
   * Space: O(k) where k = result size
   */
  static paginate(
    page: number = 1,
    pageSize: number = 12,
    filters?: ProductFilter,
  ): PaginatedResult<Product> {
    const allProducts = this.getAll();
    let filtered = allProducts;

    if (filters) {
      filtered = allProducts.filter((product) => this.matchesFilter(product, filters));
    }

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = filtered.slice(startIndex, endIndex);

    return {
      items,
      page,
      pageSize,
      totalCount,
      totalPages,
    };
  }

  /**
   * Search across product catalog with fuzzy matching
   * Time: O(n * m) where n = products, m = search terms
   * Space: O(k) where k = result size
   */
  static search(query: string, filters?: ProductFilter): readonly Product[] {
    if (!query || query.trim().length === 0) {
      return this.paginate(1, Number.MAX_SAFE_INTEGER, filters).items;
    }

    const searchTerm = query.toLowerCase();
    const allProducts = this.getAll();

    const filtered = allProducts.filter((product) => {
      if (filters && !this.matchesFilter(product, filters)) {
        return false;
      }

      const searchableFields = [
        product.name.toLowerCase(),
        product.description.toLowerCase(),
        product.category.toString().toLowerCase(),
        product.availableMaterials.map((m) => m.toString().toLowerCase()).join(" "),
        product.availableGemstones.join(" ").toLowerCase(),
      ];

      return searchableFields.some((field) => field.includes(searchTerm));
    });

    return filtered;
  }

  /**
   * Filter products by criteria (no pagination)
   * Time: O(n) where n = all products
   * Space: O(k) where k = result size
   */
  static filter(filters: ProductFilter): readonly Product[] {
    return this.getAll().filter((product) => this.matchesFilter(product, filters));
  }

  /**
   * Get featured products only
   * Time: O(n) where n = all products
   * Space: O(k) where k = featured count
   */
  static getFeatured(): readonly Product[] {
    return this.getAll().filter((p) => p.isFeatured);
  }

  /**
   * Get products by category
   * Time: O(n) where n = all products
   * Space: O(k) where k = category count
   */
  static getByCategory(category: ProductCategory): readonly Product[] {
    return this.getAll().filter((p) => p.category === category);
  }

  /**
   * Check if a product matches all filter criteria
   */
  private static matchesFilter(product: Product, filter: ProductFilter): boolean {
    if (filter.category && product.category !== filter.category) {
      return false;
    }

    if (filter.material && !product.availableMaterials.includes(filter.material)) {
      return false;
    }

    if (filter.gemstone && !product.availableGemstones.includes(filter.gemstone)) {
      return false;
    }

    if (filter.size && !product.availableSizes.includes(filter.size)) {
      return false;
    }

    if (filter.minPrice && product.basePrice < filter.minPrice) {
      return false;
    }

    if (filter.maxPrice && product.basePrice > filter.maxPrice) {
      return false;
    }

    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase();
      const searchableFields = [
        product.name.toLowerCase(),
        product.description.toLowerCase(),
        product.category.toString().toLowerCase(),
      ];

      if (!searchableFields.some((field) => field.includes(searchTerm))) {
        return false;
      }
    }

    return true;
  }

  /**
   * Extract distinct gemstone values from all products
   * Time: O(n) where n = all products
   * Space: O(g) where g = distinct gemstones
   */
  static getDistinctGemstones(): readonly string[] {
    const allProducts = this.getAll();
    const gemstones = new Set<string>();

    for (const product of allProducts) {
      for (const gemstone of product.availableGemstones) {
        gemstones.add(gemstone);
      }
    }

    return Array.from(gemstones).sort();
  }

  /**
   * Extract distinct sizes from all products
   * Time: O(n) where n = all products
   * Space: O(s) where s = distinct sizes
   */
  static getDistinctSizes(): readonly RingSize[] {
    const allProducts = this.getAll();
    const sizes = new Set<RingSize>();

    for (const product of allProducts) {
      for (const size of product.availableSizes) {
        sizes.add(size);
      }
    }

    return Array.from(sizes).sort((a, b) => Number(a) - Number(b));
  }
}