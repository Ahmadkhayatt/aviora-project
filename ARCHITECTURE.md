# LUXE JEWELS — Technical Architecture Blueprint

## 1. Executive Summary

**Project:** Premium Jewelry & Rings E-commerce Platform  
**Stack:** Next.js 14 (App Router) + React 18 + TypeScript 5.6 + Tailwind CSS 3.4 + Zustand  
**Architecture Pattern:** Clean Architecture (Ports & Adapters / Hexagonal)  
**Generated:** 2026-07-02 | **Version:** 1.0.0  

This document serves as the **single source of truth** for all architectural decisions, mathematical models, state machines, and execution blueprints for the LUXE JEWELS platform. Every subsequent agent in the pipeline must consume and conform to this blueprint.

---

## 2. Requirements Decomposition

### 2.1 Core Feature Set

| # | Feature | Computational Problem | Algorithmic Paradigm |
|---|---------|---------------------|---------------------|
| 1 | Barcode Generation | Digit → Bar Pattern Mapping | Lookup-table + modular arithmetic (O(n)) |
| 2 | Barcode Rendering | Pattern → SVG/Canvas rendering | Deterministic pixel mapping |
| 3 | Inventory Management | Quantity lifecycle | Finite State Machine (4 states, 9 transitions) |
| 4 | SKU Generation | Cartesian product combinatorics | Combinatorial enumeration (S × M × G) |
| 5 | Product Catalog | Filter/Search/Paginate | B-tree (indexed) + client-side sort O(n log n) |
| 6 | Admin Dashboard | CRUD + summary aggregation | RESTful + optimistic UI + audit trail |
| 7 | Real-time Inventory | Stock count display | Poll-based (5s) or SSR hydration |

### 2.2 Non-Functional Requirements

- **Performance:** < 100ms first paint, < 50ms barcode render, < 16ms inventory update
- **Scalability:** Support 10,000+ products, 100,000+ variants
- **Security:** Admin routes protected by middleware; form validation via Zod
- **Accessibility:** WCAG 2.1 AA compliant; semantic HTML; focus management
- **Determinism:** All mathematical operations must produce identical output for identical input

---

## 3. Algorithmic Approach

### 3.1 Barcode System: Code-128B + EAN-13

**Primary Format:** Code-128B (alphanumeric, high-density, ideal for SKU tracking)  
**Secondary Format:** EAN-13 (numeric, retail POS compatibility)  

#### 3.1.1 Code-128B Mathematical Model

```
Encoding: Each ASCII character (32-126) maps to a Code-128 index (value = ASCII - 32).
          Each index maps to an 11-bit bar pattern from the lookup table.

Start Code B:    value 104, pattern 0b11010000100
Data characters:  each character contributes value_i = ASCII(char) - 32
Check Digit:     (104 + Σ(i × value_i)) mod 103
Stop Pattern:    value 106, 13-bit pattern 0b1100011101011

Total modules = 11(start) + 11×n(data) + 11(check) + 13(stop) + 20(quiet zones)
               = 55 + 11n    where n = data length

Space complexity: O(11n) — linear in input length
Time complexity:  O(n)    — single pass over characters
```

#### 3.1.2 EAN-13 Mathematical Model

```
Check Digit Formula:
  Let digits d₁...d₁₂ be the 12 data digits.
  S = Σ(dᵢ × wᵢ) where wᵢ = 1 for odd i, 3 for even i
  Check = (10 - (S mod 10)) mod 10

Parity Encoding (first digit determines L vs G pattern for left half):
  First digit → parity pattern (6 characters: L or G)
  Each L/G digit encodes 7-bit pattern (L-code or G-code)
  Right half always uses R-code

Total modules: 3(start guard) + 6×7(left) + 5(middle guard) + 6×7(right) + 3(end guard) = 95

Time: O(13) — constant
Space: O(95) modules
```

#### 3.1.3 Determinism Guarantee

For any input string `s`, `BarcodeGenerator.generateCode128B(s)` produces the **exact same** 13-digit numeric string on every invocation. This is guaranteed by:

- Fixed prime (1000000000039) for hashing
- Deterministic overflow handling via BigInt
- No external random sources used

### 3.2 Inventory State Machine

```
States:      { IN_STOCK, LOW_STOCK (≤5), OUT_OF_STOCK (0), DISCONTINUED }
Transitions:
  IN_STOCK      → LOW_STOCK     (qty drops to ≤5)
  IN_STOCK      → OUT_OF_STOCK  (qty reaches 0)
  IN_STOCK      → DISCONTINUED  (admin)

  LOW_STOCK     → IN_STOCK      (restock above threshold)
  LOW_STOCK     → OUT_OF_STOCK  (sell last unit)
  LOW_STOCK     → DISCONTINUED  (admin)

  OUT_OF_STOCK  → IN_STOCK      (restock above threshold)
  OUT_OF_STOCK  → LOW_STOCK     (partial restock)
  OUT_OF_STOCK  → DISCONTINUED  (admin)

  DISCONTINUED  → (terminal — no further transitions)

Invariant:   0 ≤ quantity ≤ MAX_SAFE_INTEGER
Pre-condition:  delta + currentQuantity ≥ 0  (post-condition: quantity = max(0, old + delta))
Side-effect:   transaction log created with prev/next state snapshot
```

### 3.3 SKU Combinatorics

```
For a given product configuration:
  S = |availableSizes|    (e.g., 17 ring sizes)
  M = |availableMaterials| (e.g., 8 materials)
  G = |availableGemstones| (e.g., 5 gemstones, or 1 if no gemstone)

Total Variants = S × M × max(1, G) = 17 × 8 × 5 = 680 possible variants

Each variant receives:
  - Unique SKU:   CATEGORY-MATERIAL-SIZE-GEMSTONE-SEQUENCE
  - Unique Barcode: EAN-13 format (13 digits)
  - Independent Quantity: tracked separately
```

---

## 4. System Architecture

### 4.1 Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (React Components, Hooks, Pages)     │
│  src/presentation/                                         │
│  Depends on: Application, Domain                          │
├─────────────────────────────────────────────────────────────┤
│  APPLICATION LAYER (Use Cases, Orchestration, Flows)      │
│  src/application/                                         │
│  Depends on: Domain                                     │
├──────────────────────────────────────────────────────────────┤
│  DOMAIN LAYER (Entities, Value Objects, Domain Services) │
│  src/domain/                                            │
│  Depends on: Nothing (Pure, isolated)                     │
├─────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER (DB, Storage, External APIs)       │
│  src/infrastructure/                                       │
│  Depends on: Domain (implements interfaces)               │
├─────────────────────────────────────────────────────────────┤
│  SHARED LAYER (Types, Constants, Utilities)             │
│  src/shared/                                             │
│  Depends on: Nothing (Cross-cutting)                     │
└───────────────────────────────────────────────────────────────┘
```

**Dependency Rule:** Dependencies point inward. Outer layers depend on inner layers. Inner layers never depend on outer layers. The domain layer is the purest, with zero framework dependencies.

### 4.2 Module Dependency Graph

```
presentation/components/
  → application/products/          (use cases)
  → application/inventory/       (use cases)
  → domain/entities/             (Product, ProductVariant)
  → domain/services/           (BarcodeGenerator, InventoryManager)
  → shared/types/              (type definitions)

app/(public)/                   (Next.js pages)
  → presentation/components/     (UI components)

app/(admin)/                    (Admin pages)
  → presentation/components/admin/
  → application/products/        (admin use cases)

Domain is 100% isolated — no imports from Next.js, React, or any framework.
```

### 4.3 Data Flow

```
[User Action] → [React Component/Form]
  → [Application Use Case] (validation, orchestration)
    → [Domain Service] (business logic, math)
      → [Domain Entity] (data model)
        → [Infrastructure] (persistence)

Response flow reverses: Infrastructure → Entity → Service → Use Case → Component
```

---

## 5. Module Breakdown

### 5.1 Domain Layer (Pure Business Logic)

| Module | Path | Responsibility | Key Export |
|--------|------|---------------|------------|
| `Product` | `domain/entities/` | Core product entity with variants | `Product`, `ProductVariant` interfaces |
| `Barcode` | `domain/entities/` | Barcode value object | `Barcode13`, `BarcodeFormat` |
| `Inventory` | `domain/entities/` | Inventory transaction log | `InventoryTransaction` |
| `SKU` | `domain/value-objects/` | SKU combinatorics & validation | `SKU.generate()`, `SKU.isValid()` |
| `Price` | `domain/value-objects/` | Monetary value (cents) | `Price.fromCents()`, `Price.format()` |
| `BarcodeGenerator` | `domain/services/` | Barcode math engine | `generateEAN13()`, `generateCode128B()`, `render()` |
| `InventoryManager` | `domain/services/` | Inventory FSM | `applyDelta()`, `restock()`, `recordSale()` |

### 5.2 Application Layer (Use Cases)

| Module | Path | Responsibility |
|--------|------|----------------|
| `ProductCatalogUseCase` | `application/products/` | Fetch/filter/paginate products |
| `ProductCRUDUseCase` | `application/products/` | Create/update/delete products |
| `InventoryTrackingUseCase` | `application/inventory/` | Track quantities, trigger alerts |
| `BarcodeGenerationUseCase` | `application/barcode/` | Generate & validate barcodes |

### 5.3 Presentation Layer (UI Components)

| Module | Path | Components |
|--------|------|------------|
| `UI Primitives` | `components/ui/` | `Button`, `Input`, `Modal`, `Card`, `Table`, `Badge`, `Toast` |
| `Product` | `components/product/` | `ProductCard`, `ProductGrid`, `ProductDetail`, `VariantSelector` |
| `Barcode` | `components/barcode/` | `BarcodeSVG`, `BarcodeCanvas`, `BarcodeDisplay`, `BarcodePrint` |
| `Admin` | `components/admin/` | `AdminLayout`, `ProductForm`, `VariantTable`, `DashboardStats`, `InventoryTracker` |
| `Layout` | `components/layout/` | `Header`, `Footer`, `Navigation`, `SearchBar` |
| `Catalog` | `components/catalog/` | `CatalogFilters`, `CatalogSort` |
| `Hero` | `components/hero/` | `HeroSection`, `FeaturedProducts` |
| `Contact` | `components/contact/` | `ContactForm`, `Map` |
| `Search` | `components/search/` | `SearchOverlay`, `SearchResults` |

### 5.4 Infrastructure Layer

| Module | Path | Purpose |
|--------|------|---------|
| `Database` | `infrastructure/database/` | In-memory store (for demo); replaceable with Prisma/Postgres |
| `Storage` | `infrastructure/storage/` | Image asset management |

### 5.5 Shared Layer

| Module | Path | Purpose |
|--------|------|---------|
| `Types` | `shared/types/index.ts` | All type definitions, enums, interfaces — the **master contract** |
| `Constants` | `shared/constants/index.ts` | Immutable configuration, lookup tables, thresholds |
| `Utilities` | `shared/utils/` | Barcode color converter, formatting helpers |

---

## 6. Execution Blueprint

### 6.1 Barcode Generation Flow

```
┌───────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User/Admin    │────▶│  BarcodeGenerator │────▶│  SVG Renderer    │
│  provides SKU  │     │  .render(data,    │     │  (canvas/webgl)  │
│  or product ID │     │   format)         │     │                   │
└───────┬───────┘     └────────┬─────────┘     └────────┬────────┘
        │                      │                          │
        │                      │ 1. HashMap lookup      │
        │                      │ 2. Check digit calc    │
        │                      │ 3. Bar pattern gen     │
        │                      │                        │
        │              ┌───────▼──────────┐              │
        │              │  BarcodePattern   │─────────────┘
        │              │  {bars[],         │   Renders
        │              │   spaces[],        │   to SVG
        │              │   totalModules,   │   Element
        │              │   humanReadable}  │
        │              └──────────────────┘
```

### 6.2 Inventory Update Flow

```
┌───────────────┐     ┌────────────────┐     ┌───────────────┐
│  Admin Form   │────▶│ InventoryManager│────▶│  Updated       │
│  (quantity    │     │  .applyDelta() │     │  ProductVariant│
│   change)     │     │                 │     │  + Transaction │
└───────────────┘     └────────────────┘     └───────────────┘
        │                    │                        │
        │                    │ 1. Compute new qty   │
        │                    │ 2. Evaluate status   │
        │                    │ 3. Validate transition │
        │                    │ 4. Return updated    │
        │                    │                      │
        ▼                    ▼                      ▼
   Optimistic UI update → State refresh → UI re-render
```

### 6.3 Admin Dashboard Flow

```
[Admin Login] → [Middleware Auth Check]
  → [Dashboard Lay-out]
    → [Fetch Summary]        — GET /api/admin/summary
    → [Fetch Products]      — GET /api/admin/products?page=1&size=20
    → [Fetch Low Stock]    — GET /api/admin/inventory/low-stock
    → [Product CRUD Form]  — POST/PUT /api/admin/products/:id
    → [Barcode Panel]      — BarcodeGenerator.render(sku, format)
    → [Inventory Tracker]  — InventoryManager.applyDelta(variant, delta)
```

---

## 7. File Structure (Complete)

```
luxe-jewels/
├── ARCHITECTURE.md                    ← This document
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── .eslintrc.json
├── .prettierrc
├── vitest.config.ts
│
├── public/
│   ├── images/                        ← Static assets
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   ├── app/                           ← Next.js App Router (Pages)
│   │   ├── layout.tsx                ← Root layout (theme, fonts, metadata)
│   │   ├── globals.css              ← Tailwind directives + custom CSS
│   │   │
│   │   ├── (public)/                 ← Public-facing route group
│   │   │   ├── page.tsx             ← Hero/Landing page
│   │   │   ├── layout.tsx           ← Public layout wrapper
│   │   │   ├── catalog/
│   │   │   │   ├── page.tsx         ← Catalog listing
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx     ← Product detail page
│   │   │   ├── contact/
│   │   │   │   └── page.tsx         ← Contact form
│   │   │   └── search/
│   │   │       └── page.tsx         ← Search results
│   │   │
│   │   └── (admin)/                  ← Admin route group
│   │       ├── layout.tsx            ← Admin shell (sidebar, header)
│   │       ├── dashboard/
│   │       │   ├── page.tsx          ← Dashboard home (stats)
│   │       │   ├── products/
│   │       │   │   ├── page.tx      ← Product list (CRUD)
│   │       │   │   └── [id]/
│   │       │   │       └── page.tsx  ← Edit single product
│   │       │   ├── barcodes/
│   │       │   │   └── page.tsx      ← Barcode generation panel
│   │       │   └── inventory/
│   │       │       └── page.tsx      ← Inventory tracker
│   │       │
│   │       └── api/                  ← API Routes
│   │           ├── products/
│   │           │   └── route.ts
│   │           ├── admin/
│   │           │   ├── summary/route.ts
│   │           │   ├── products/route.ts
│   │           │   └── inventory/route.ts
│   │           └── barcode/
│   │               └── route.ts
│   │
│   ├── domain/                       ← Pure business logic
│   │   ├── entities/
│   │   │   ├── Product.ts            ← Product entity (interface + factory)
│   │   │   ├── Barcode.ts            ← Barcode value object
│   │   │   └── Inventory.ts          ← Inventory transaction entity
│   │   ├── value-objects/
│   │   │   ├── SKU.ts                ← SKU combinatorics
│   │   │   ├── Price.ts             ← Price in cents (formatting)
│   │   │   └── Dimensions.ts         ← Measurement value object
│   │   └── services/
│   │       ├── BarcodeGenerator.ts    ← Barcode math engine (complete)
│   │       └── InventoryManager.ts    ← Inventory FSM (complete)
│   │
│   ├── application/                 ← Use cases / orchestration
│   │   ├── products/
│   │   │   └── ProductCatalogUseCase.ts
│   │   ├── inventory/
│   │   │   └── InventoryTrackingUseCase.ts
│   │   └── barcode/
│   │       └── BarcodeDisplayUseCase.ts
│   │
│   ├── infrastructure/              ← External interfaces
│   │   ├── database/
│   │   │   └── inMemoryStore.ts      ← Temporary in-memory store
│   │   └── storage/
│   │       └── imageStore.ts
│   │
│   ├── presentation/                  ← UI Layer
│   │   ├── components/
│   │   │   ├── ui/                   ← Atomic design tokens
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── Toast.tsx
│   │   │   ├── product/
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductGrid.tsx
│   │   │   │   ├── ProductDetail.tsx
│   │   │   │   └── VariantSelector.tsx
│   │   │   ├── barcode/
│   │   │   │   ├── BarcodeSVG.tsx       ← SVG renderer
│   │   │   │   ├── BarcodeCanvas.tsx    ← Canvas renderer
│   │   │   │   ├── BarcodeDisplay.tsx   ← Complete display
│   │   │   │   └── BarcodePrint.tx     ← Print-optimized layout
│   │   │   ├── admin/
│   │   │   │   ├── AdminLayut.tsx
│   │   │   │   ├── ProductForm.tsx      ← Zod-validated form
│   │   │   │   ├── VariantTable.tsx
│   │   │   │   ├── DashboardStats.tsx   ← KPI cards
│   │   │   │   ├── InventoryTracker.tsx   ← Quantity management
│   │   │   │   └── BarcodePanel.tsx     ← Barcode generation UI
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   └── SearchBar.tsx
│   │   │   ├── catalog/
│   │   │   │   ├── CatalogFilters.tsx
│   │   │   │   └── CatalogSort.tsx
│   │   │   ├── hero/
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   └── FeaturedProducts.tsx
│   │   │   ├── contact/
│   │   │   │   └── ContactForm.tsx
│   │   │   └── search/
│   │   │       ├── SearchOverlay.tsx
│   │   │       └── SearchResults.tsx
│   │   ├── hooks/
│   │   │   ├── useProducts.ts         ← Product data fetching
│   │   │   ├── useBarcode.ts          ← Barcode generation hook
│   │   │   ├── useInventory.ts         ← Inventory status hook
│   │   │   └── useAdmin.ts            ← Admin authentication hook
│   │   └── contexts/
│   │       └── AppContext.tsx           ← Global state (optional)
│   │
│   └── shared/                        ← Cross-cutting
│       ├── types/
│       │   └── index.ts              ← Master type contract (complete)
│       ├── constants/
│       │   └── index.ts              ← Config + lookup tables (complete)
│       └── utils/
│           └── barcode-utils.ts      ← Helper functions
│
└── __tests__/                         ← Test suite
    ├── domain/
    │   ├── BarcodeGenerator.test.ts
    │   └── InventoryManager.test.ts
    ├── components/
    │   └── BarcodeSVG.test.tsx
    └── integration/
        └── admin-flow.test.ts
```

---

## 8. Component Contract Definitions

### 8.1 BarcodeSVG Props

```typescript
interface BarcodeSVGProps {
  readonly data: string;              // The text to encode
  readonly format?: BarcodeFormat;    // Default: CODE128B
  readonly barHeight?: number;        // Default: 80
  readonly barWidthUnit?: number;    // Default: 1
  readonly showText?: boolean;        // Default: true
  readonly foreground?: string;       // Default: "#000000"
  readonly background?: string;       // Default: "#FFFFFF"
  readonly scale?: number;            // Default: 1.0
}

// Output: Renders an <svg> element with <rect> bars
// Behavior: Calls BarcodeGenerator.encode() → maps bar widths → generates SV G
```

### 8.2 ProductCard Props

```typescript
interface ProductCardProps {
  readonly product: Product;
  readonly onClick?: (product: Product) => void;
  readonly variant?: "grid" | "list";
}

// Behavior: Displays product image, name, starting price, material badges
// States: Loading (skeleton), Error (fallback image), Normal
```

### 8.3 Admin ProductForm Props

```typescript
interface ProductFormProps {
  readonly initialData?: Partial<ProductFormData>;
  readonly onSubmit: (data: ProductFormData) => Promise<void>;
  readonly isLoading: boolean;
}

// Validation: Zod schema → ProductFormData
// Behavior: Controlled form with react-hook-form, toast on success/error
```

---

## 9. Cross-File Consistency Requirements

### 9.1 Naming Conventions

- **Files:** PascalCase for components (`ProductCard.tsx`), kebab-case for non-component files (`barcode-utils.ts`)
- **Exports:** Named exports only (no default exports except Next.js page components)
- **Interfaces:** `I`- free prefix (use plain descriptive names)
- **Types:** Use `type` for unions/primitives, `interface` for object shapes
- **Imports:** `@/` alias maps to `src/`

### 9.2 Import Order

```typescript
// 1. External libraries
// 2. Shared types & constants
// 3. Domain services
// 4. Application use cases
// 5. Presentation components
// 6. Relative imports (styles, assets)
```

### 9.3 Type Safety

- Every function must have explicit return type
- Every component must have `Props` interface
- No `any` type allowed in production code
- `readonly` for all array/object properties that should not mutate

---

## 10. Testing Strategy

| Layer | Test Type | Tool | Coverage Target |
|-------|----------|------|----------------|
| Domain | Unit tests | Vitest | 100% (critical math) |
| Component | Unit + Snapshot | Vitest + Testing Library | 90% |
| Integration | E2E flows | Vitest | Key user journeys |
| QA | Brutal edge-case fuzzing | @brutal-qa-auditor | Zero defects |

---

## 11. Deployment Architecture

```
[Next.js 14 App] → [Vercel / self-hosted]
  ├── SSG: Public pages (Hero, Catalog) — pre-rendered at build
  ├── SSR: Product detail pages — server-rendered for SEO
  ├── CSR: Admin dashboard — fully client-side after auth check
  └── ISR: Revalidate every 60s for inventory data freshness
```

---

## 12. Appendix: Quick Reference

### SKU Format
```
{CATEGORY_CODE}-{MATERIAL_CODE}-{SIZE}-{GEMSTONE}-{SEQUENCE}
Example: ER-18YW-007-DIA-0001
```

### Barcode Format
```
EAN-13: 070000000001X    (system_code + product_code + check_digit)
Code-128B: Encoded alphanumeric string → 13-digit hash for DB storage
```

### Inventory Status Colors (Tailwind)
```
IN_STOCK:      bg-emerald-100 text-emerald-800
LOW_STOCK:     bg-amber-100 text-amber-800
OUT_OF_STOCK:  bg-rose-100 text-rose-800
DISCONTINUED:  bg-slate-100 text-slate-500
```

---

**End of Architecture Blueprint.**  
This document is the authoritative reference. All subsequent agents must consume and adhere to its specifications.

_Generated by the Principal Enterprise Software Architect — 2026-07-02_
