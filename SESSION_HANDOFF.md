# AVIORA — Session Handoff Report

> **Generated:** July 2, 2026  
> **Project:** Luxury Jewelry E-Commerce  
> **Root Path:** `C:\Users\ASUS\Desktop\test things\aviora`

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | AVIORA |
| **Stack** | Next.js 14.2.15 + React 18 + TypeScript |
| **Database** | PostgreSQL (Supabase) via Prisma ORM 5.22.0 |
| **Auth** | Supabase Auth (email/password) + RBAC (CUSTOMER / ADMIN) |
| **Styling** | Tailwind CSS (gold/charcoal luxury theme, Playfair Display serif) |
| **Validation** | Zod + react-hook-form + @hookform/resolvers |

---

## 2. Current State (All Green)

| Check | Status |
|-------|--------|
| **TypeScript** | `npx tsc --noEmit` → **ZERO ERRORS** |
| **Prisma Schema** | `npx prisma validate` → **VALID** |
| **Prisma Client** | Generated at `node_modules/.prisma/client` |
| **Brand** | "AVIORA" — consistent everywhere, no old "LUXE JEWELS" references |
| **Source Files** | 62 files (36 `.ts` + 26 `.tsx`) |

---

## 3. Architecture (Clean Architecture)

```
src/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # Admin dashboard (protected)
│   │   ├── layout.tsx            # Server component with requireAdmin()
│   │   ├── AdminShell.tsx        # Client component sidebar
│   │   ├── dashboard/
│   │   ├── barcodes/
│   │   ├── inventory/
│   │   ├── invoices/
│   │   └── products/
│   ├── (public)/                 # Public pages
│   │   ├── catalog/
│   │   ├── contact/
│   │   ├── search/
│   │   └── [slug]/
│   ├── api/                      # 12 API routes
│   ├── auth/                     # Login + Signup pages
│   ├── layout.tsx                # Root layout (metadata: "AVIORA")
│   └── page.tsx                  # Landing page
├── application/                  # Use cases
│   ├── products/ProductCatalogUseCase.ts
│   ├── barcode/BarcodeDisplayUseCase.ts
│   └── inventory/InventoryTrackingUseCase.ts
├── domain/                       # Business logic layer
│   ├── services/
│   │   ├── BarcodeGenerator.ts   # Code-128B (O(n)) + EAN-13 (O(1))
│   │   ├── InventoryManager.ts   # 4-state FSM
│   │   └── __tests__/
│   └── value-objects/SKU.ts      # Cartesian product combinatorics
├── infrastructure/
│   └── database/inMemoryStore.ts
├── lib/
│   ├── auth.ts                   # getAuthenticatedUser, requireAuth, requireAdmin, etc.
│   └── prisma.ts                 # Prisma client singleton
├── presentation/
│   ├── components/               # 20+ UI components
│   ├── contexts/
│   └── hooks/                    # useProducts, useBarcode, useInventory, useAdmin
├── shared/
│   ├── constants/index.ts        # BRAND_NAME = "AVIORA"
│   ├── types/index.ts            # Branded types, enums, interfaces
│   └── utils/
└── utils/supabase/
    ├── server.ts                 # Server-side Supabase client
    ├── client.ts                 # Browser Supabase client
    └── middleware.ts             # Middleware Supabase client
```

---

## 4. API Routes (12 Total)

### Auth (3)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/signup` | POST | Public | Register with Zod validation, auto-role detection |
| `/api/auth/login` | POST | Public | Supabase `signInWithPassword` |
| `/api/auth/logout` | POST | Public | Supabase `signOut` |

### Products (2)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/products` | GET | Public | Listing with pagination, search, category filter, Cache-Control |
| `/api/products/[id]` | GET | Public | Single product (by UUID or slug) with variants |

### Admin — Inventory (1)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/admin/inventory` | GET | Admin | Dashboard summary (total products, variants, units, low/out-of-stock counts) |

### Admin — Products (2)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/admin/products` | POST | Admin | Create product with Zod validation, auto-slug |
| `/api/admin/products/[id]` | DELETE | Admin | Soft archive (status → `ARCHIVED`) |

### Admin — Variants (2)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/admin/variants` | POST | Admin | Create variant with SKU/barcode uniqueness |
| `/api/admin/variants/[id]` | PUT | Admin | Update variant (quantity, price, status) with auto-status logic |

### Invoices (2)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/invoices` | GET, POST | Customer | List own invoices / create (with stock decrement in transaction) |
| `/api/admin/invoices` | GET | Admin | All invoices with filters + pagination |

---

## 5. Auth & Admin Protection (Defense in Depth)

### Three-Layer Security

1. **Middleware** (`src/middleware.ts`) — Edge-level check
   - Blocks `/dashboard/*` for non-authenticated users
   - Validates email domain against `ADMIN_EMAIL_DOMAINS` env var (default: `avoria.com`)
   - Sets custom headers (`x-user-id`, `x-user-email`, `x-user-role`)

2. **Admin Layout** (`src/app/(admin)/layout.tsx`) — Server Component
   - Calls `requireAdmin()` which checks Prisma `role` field
   - Redirects to `/auth/login` if not authenticated, `/` if not admin

3. **Each Admin API Route** — Independent verification
   - Verifies Supabase session (`supabase.auth.getUser()`)
   - Verifies Prisma role (`user.role === "ADMIN"`)

### Auth Helper Functions (`src/lib/auth.ts`)

| Function | Purpose |
|----------|---------|
| `getAuthenticatedUser()` | Returns user from Prisma (with role) or null |
| `requireAuth()` | Redirects to `/auth/login` if not authenticated |
| `requireAdmin()` | Redirects to `/` if not admin |
| `isAdminEmail()` | Checks email domain against whitelist |
| `hasRole()` | Role hierarchy comparison |

---

## 6. Database Schema — Prisma (6 Models + 6 Enums)

### Models

```
User
├── id (cuid) PK
├── email (unique)
├── passwordHash
├── firstName?, lastName?, phone?
├── role: UserRole (CUSTOMER | ADMIN)
├── isActive
├── sessions Session[]
└── invoices Invoice[]

Session
├── id (cuid) PK
├── userId FK → User
├── token (unique)
├── ipAddress?, userAgent?
└── expiresAt

Product
├── id (cuid) PK
├── name
├── slug (unique)
├── description
├── category: ProductCategory (9 values)
├── basePrice (cents)
├── coverImage?, images[]
├── availableSizes Float[], availableMaterials JewelryMaterial[]
├── availableGemstones String[]
├── isFeatured
├── status: ProductStatus (ACTIVE | DRAFT | ARCHIVED)
└── variants ProductVariant[]

ProductVariant
├── id (cuid) PK
├── productId FK → Product
├── sku (unique)
├── barcode (unique)
├── size, material: JewelryMaterial, gemstone?
├── price (cents), quantity
├── status: InventoryStatus (IN_STOCK | LOW_STOCK | OUT_OF_STOCK | DISCONTINUED)
├── images[]
├── product Product
└── invoiceItems InvoiceItem[]

Invoice
├── id (cuid) PK
├── invoiceNumber (unique)
├── userId FK → User
├── status: InvoiceStatus (PENDING | PAID | CANCELLED | REFUNDED)
├── subtotal, taxAmount, totalAmount (cents)
├── billingName?, billingEmail?, billingPhone?, billingAddress?
├── paidAt?
├── user User
└── items InvoiceItem[]

InvoiceItem
├── id (cuid) PK
├── invoiceId FK → Invoice
├── variantId FK → ProductVariant
├── productName, sku, size, material, gemstone?
├── quantity, unitPrice, lineTotal
├── invoice Invoice
└── variant ProductVariant
```

### Enums

```
UserRole:          CUSTOMER | ADMIN
ProductStatus:     ACTIVE | DRAFT | ARCHIVED
ProductCategory:   ENGAGEMENT_RING | WEDDING_BAND | ETERNITY_BAND | COCKTAIL_RING
                   | SIGNET_RING | NECKLACE | BRACELET | EARRINGS | PENDANT
JewelryMaterial:   GOLD_18K_YELLOW | GOLD_18K_WHITE | GOLD_18K_ROSE | GOLD_24K
                   | PLATINUM | STERLING_SILVER_925 | TITANIUM | PALLADIUM
InventoryStatus:   IN_STOCK | LOW_STOCK | OUT_OF_STOCK | DISCONTINUED
InvoiceStatus:     PENDING | PAID | CANCELLED | REFUNDED
```

---

## 7. Auth Pages

| Page | File | Features |
|------|------|----------|
| **Login** | `src/app/auth/login/page.tsx` | Zod validation, smart redirect (admin → `/dashboard`, customer → `/`), gold/charcoal luxury theme, loading/error states |
| **Signup** | `src/app/auth/signup/page.tsx` | Zod validation with password confirmation, auto-login after signup, same luxury theme |

---

## 8. UI Components (20+)

All in `src/presentation/components/`:

| Component | Description |
|-----------|-------------|
| `Button` | Variants: primary, secondary, outline, ghost. Sizes: sm, md, lg |
| `Input` | With label, error state, icon slot |
| `Modal` | Overlay, close button, keyboard dismiss |
| `Card` | Product card with image, title, price |
| `Table` | Sortable columns, striped rows |
| `Badge` | Status indicators (success, warning, error, info) |
| `Toast` | Notification system |
| `ProductCard` | Catalog item with hover effects |
| `ProductGrid` | Responsive grid layout |
| `ProductDetail` | Full product view with variant selector |
| `VariantSelector` | Size/material/gemstone picker |
| `BarcodeSVG` | SVG barcode renderer |
| `HeroSection` | Landing page hero |
| `FeaturedProducts` | Featured product grid |
| `ContactForm` | Contact form with validation |
| `SearchOverlay` | Full-screen search |
| `SearchResults` | Search result listing |
| `CatalogFilters` | Category filter sidebar |
| `CatalogSort` | Sort dropdown |
| `DashboardStats` | Admin dashboard stat cards |
| `ProductForm` | Admin product create/edit form |
| `VariantTable` | Admin variant management |
| `BarcodePanel` | Admin barcode generator |
| `InventoryTracker` | Inventory status management |

---

## 9. Business Logic (Domain Services)

### BarcodeGenerator (`src/domain/services/BarcodeGenerator.ts`)
- **Code-128B**: O(n) time, deterministic encoding with checksum
- **EAN-13**: O(1) time with weighted checksum algorithm
- **Hashing**: Deterministic barcode from product + variant keys

### InventoryManager (`src/domain/services/InventoryManager.ts`)
- **4-State FSM**: `IN_STOCK` ↔ `LOW_STOCK` ↔ `OUT_OF_STOCK` ↔ `DISCONTINUED`
- **9 legal transitions** with invariant enforcement
- **Audit trail**: Every transition logged with timestamp and reason

### SKU Value Object (`src/domain/value-objects/SKU.ts`)
- **Cartesian product**: S × M × max(1, G) variant enumeration
- **Deterministic SKU format**: `{PRODUCT_SLUG}_{SIZE}_{MATERIAL}`

---

## 10. Issues Resolved This Session

20 TypeScript errors were fixed across the following categories:

| Category | Count | Files |
|----------|-------|-------|
| `"use client"` missing quotes | 1 | `AdminShell.tsx` |
| `JewelryMaterial[]` type mismatches | 4 | `prisma/seed.ts`, `admin/products/route.ts` |
| Unused imports (`requireAdmin`, `createClient`) | 7 | `admin/inventory`, `admin/invoices`, `admin/products/[id]`, `admin/variants/*`, `invoices`, `products/*` |
| Unused parameters (`request`) | 4 | `admin/inventory`, `admin/products/[id]`, `auth/logout`, `products/[id]` |
| Unused variables | 3 | `dateFilter`, `inventoryQuerySchema`, `isPublicRoute`, `PUBLIC_ROUTES` |
| Non-existent model reference | 1 | `prisma.inventoryTransaction` — removed query |
| Syntax error (missing `>`) | 2 | `login/page.tsx`, `signup/page.tsx` — `useForm<T>({` vs `useForm<T({` |

---

## 11. Available Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Next.js lint
npm run type-check       # tsc --noEmit
npm test                 # Vitest
npm run test:watch       # Vitest watch mode
npm run audit            # lint + type-check + test

npm run db:generate      # Prisma generate
npm run db:push          # Push schema to DB
npm run db:migrate       # Create migration
npm run db:seed          # Seed database
npm run db:studio        # Prisma Studio GUI
```

---

## 12. Key Configuration Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema (6 models, 6 enums) |
| `prisma/seed.ts` | Seeds admin user + 3 products with variants |
| `.env.template` | Required env vars template |
| `.env.local` | Active env vars (Supabase URL + keys, DATABASE_URL) |
| `src/shared/constants/index.ts` | Brand name "AVIORA" + app constants |
| `src/middleware.ts` | Route protection middleware |
| `BACKEND_ARCHITECTURE.md` | Backend architecture doc (ERD, auth flow, route table) |
| `ARCHITECTURE.md` | Original frontend architecture blueprint |
| `SESSION_HANDOFF.md` | **This file** |

---

## 13. Environment Variables

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://axosbugloarfyrzcucdj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_vloG6pAsIO9WJr3lbEWkeQ_H6YGjh62
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
ADMIN_EMAIL_DOMAINS=avoria.com
```

---

## 14. Next Steps (Resume Here)

1. **Build validation**: `npm run build` — verify production build succeeds
2. **Database seeding**: `npm run db:seed` — populate DB with admin user + sample products
3. **Feature additions**:
   - User profile pages
   - Password reset flow
   - Payment integration (Stripe)
   - Order management
   - Email notifications (order confirmation, shipping)
4. **Testing**:
   - Add API route integration tests
   - Expand unit tests for domain services
   - Add E2E tests (Playwright/Cypress)
5. **Deployment**:
   - Configure for Vercel/Supabase production
   - Set up CI/CD pipeline
   - Configure custom domain
6. **Monitoring**:
   - Add error tracking (Sentry)
   - Add logging (Pino/Winston)
   - Performance monitoring
