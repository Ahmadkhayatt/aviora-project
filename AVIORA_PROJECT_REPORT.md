# AVIORA — Full Project Report

> **Silver Jewellery E-Commerce Platform**
> Built with Next.js 14, Supabase, Prisma v5, TypeScript, Tailwind CSS

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Feature Branches & Git Flow](#3-feature-branches--git-flow)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Domain Services](#6-domain-services)
7. [API Routes](#7-api-routes)
8. [Frontend UI Components](#8-frontend-ui-components)
9. [Pages & Routes](#9-pages--routes)
10. [Barcode Generator Engine](#10-barcode-generator-engine)
11. [Inventory State Machine](#11-inventory-state-machine)
12. [Bugs Fixed](#12-bugs-fixed)
13. [Testing](#13-testing)
14. [Deployment Status](#14-deployment-status)
15. [Next Steps](#15-next-steps)

---

## 1. Project Overview

- **Project Name:** AVIORA
- **Description:** Silver Jewellery  
- **Package:** `aviora`
- **Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth), Prisma ORM v5.22.0
- **Brand Colors:** Gold (#D4AF37) / Charcoal / Cream — Luxury aesthetic
- **Typography:** Playfair Display (serif headings)
- **GitHub:** `https://github.com/Ahmadkhayatt/aviora-project.git`

---

## 2. Architecture

The project follows **Clean Architecture** with strict dependency rules:

```
┌──────────────────────────────────────┐
│         Presentation Layer           │
│  (React Components, Pages, Hooks)    │
│  Can import: Domain, Shared, App     │
├──────────────────────────────────────┤
│          Application Layer            │
│  (Use Cases, Orchestration)          │
│  Can import: Domain, Shared          │
├──────────────────────────────────────┤
│           Domain Layer                │
│  (Services, Value Objects, Logic)    │
│  NO imports from lib/, app/, utils/  │
├──────────────────────────────────────┤
│       Infrastructure Layer            │
│  (Database, External APIs, CMS)      │
│  Can import: Domain, Shared          │
├──────────────────────────────────────┤
│           Shared Layer                │
│  (Types, Constants, Pure Utilities)  │
│  Zero dependencies on other layers   │
└──────────────────────────────────────┘
```

### Directory Structure

```
src/
├── app/                    # Next.js App Router (pages + API)
│   ├── (admin)/            # Admin dashboard routes
│   ├── (public)/           # Public pages
│   ├── api/                # API routes (12 total)
│   └── auth/               # Login + Signup pages
├── application/            # Use case orchestration
├── domain/
│   ├── services/           # BarcodeGenerator, InventoryManager, SKU
│   ├── value-objects/      # SKU combinatorics
│   └── __tests__/          # Domain service tests
├── infrastructure/         # In-memory data store
├── lib/                    # Auth helpers, Prisma client
├── presentation/
│   ├── components/         # UI + Product + Admin components
│   └── hooks/              # Custom React hooks
├── shared/
│   ├── constants/          # Barcode tables, brand config
│   ├── types/              # Branded types, enums, interfaces
│   └── utils/              # SVG rendering, CSS utilities
└── middleware.ts           # Route protection (admin/domain check)
```

---

## 3. Feature Branches & Git Flow

**Git Flow:**
- `main` — Production-ready (default branch on GitHub)
- `dev` — Integration branch
- `feat/*` — Feature branches (merged to `dev` with `--no-ff`)

**12 Feature Branches Created & Merged:**

| # | Branch | Description |
|---|--------|-------------|
| 1 | `feat/project-setup` | Next.js 14 + TypeScript + Tailwind + ESLint + Prettier |
| 2 | `feat/clean-architecture` | Folder structure, dependency rules, barrel exports |
| 3 | `feat/domain-logic` | BarcodeGenerator, InventoryManager, SKU combinatorics |
| 4 | `feat/database` | Prisma schema (6 models), seed script, client singleton |
| 5 | `feat/supabase-auth` | Supabase SSR helpers, RBAC, middleware protection |
| 6 | `feat/api-routes` | 12 API routes with standardized envelope |
| 7 | `feat/auth-pages` | Login + Signup pages with Zod validation |
| 8 | `feat/ui-components` | 20+ production UI components |
| 9 | `feat/public-pages` | Landing, Catalog, Product Detail, Contact, Search |
| 10 | `feat/admin-dashboard` | Admin shell, dashboard, CRUD pages |
| 11 | `feat/docs` | BACKEND_ARCHITECTURE.md, SESSION_HANDOFF.md |
| 12 | `feat/branding` | Rebrand to AVIORA, fix barcode root causes |

**Current Status:**
- PR #1 merged `dev` → `main` (SHA: `62e9bf0`)
- Release: `v1.0.0` created on GitHub
- 10 uncommitted fixes included in the merge

---

## 4. Database Schema

**Platform:** PostgreSQL via Supabase + Prisma ORM v5.22.0

**6 Models:**

```
User (users)
├── id, email, passwordHash, firstName, lastName, phone
├── role (ADMIN | CUSTOMER), isActive
├── sessions[]
└── invoices[]

Session (sessions)
├── id, userId, token, ipAddress, userAgent, expiresAt

Product (products)
├── id, name, slug, description, category, basePrice
├── coverImage, images[], isFeatured, status
├── availableSizes[], availableMaterials[], availableGemstones[]
└── variants[]

ProductVariant (product_variants)
├── id, productId, sku (unique), barcode (unique)
├── size, material, gemstone, price, quantity
├── status (IN_STOCK | LOW_STOCK | OUT_OF_STOCK | DISCONTINUED)
└── images[]

Invoice (invoices)
├── id, invoiceNumber (unique), userId, status
├── subtotal, taxAmount, totalAmount, currency
├── billingName, billingEmail, billingPhone, billingAddress
└── items[]

InvoiceItem (invoice_items)
├── id, invoiceId, variantId, productName
├── sku, size, material, gemstone, quantity
├── unitPrice, lineTotal
```

**6 Enums:** UserRole, ProductStatus, ProductCategory, JewelryMaterial, InventoryStatus, InvoiceStatus

**Seed Data:** Admin user (`admin@avoria.com`), 3 sample products with variants

---

## 5. Authentication & Authorization

**System:** Supabase Auth + Email Domain RBAC

### Architecture

```
                    ┌─────────────────────┐
                    │  Supabase Auth       │
                    │  (handles passwords, │
                    │   sessions, JWT)     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Middleware (Edge)   │
                    │  - Refreshes session │
                    │  - Checks admin      │
                    │    routes vs domain  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Auth Helpers        │
                    │  (getAuthenticated,  │
                    │   requireAuth,       │
                    │   requireAdmin,      │
                    │   isAdminEmail)      │
                    └─────────────────────┘
```

### Auth Flow

1. User submits email/password at `/auth/login`
2. API calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials, returns JWT session
4. Role is determined by email domain via `isAdminEmail()`
5. `@avoria.com` emails → **ADMIN**, all others → **CUSTOMER**
6. Middleware protects `/dashboard/*` routes at edge level
7. Admin layout calls `requireAdmin()` as a second defense layer

### Admin Route Protection (Double Guard)

1. **Middleware (Edge Level):** `src/middleware.ts`
   - Protects `/dashboard/:path*`
   - Refreshes Supabase session
   - Checks `ADMIN_EMAIL_DOMAINS` env var (default: `avoria.com`)
   - Non-admin emails redirected to home page
   - Sets `x-user-role: ADMIN` header for downstream handlers

2. **Server Component (Layout Level):** `src/app/(admin)/layout.tsx`
   - Calls `await requireAdmin()` from auth helpers
   - Redirects to `/auth/login` if not authenticated
   - Redirects to `/` if role is not ADMIN

---

## 6. Domain Services

### BarcodeGenerator (`src/domain/services/BarcodeGenerator.ts`)
- **Code-128B:** O(n) encoding, printable ASCII (32-126), hash to 13 digits for DB storage
- **EAN-13:** O(1) check digit computation, O(13) pattern encoding
- **Check Digits:** EAN-13 (weighted sum mod 10), Code-128 (weighted sum mod 103)
- **Pattern Encoding:** Run-length encoding of 95-module sequence for EAN-13, bit-alternation for Code-128B
- **Safety:** Input validation for empty/invalid characters with descriptive error messages

### InventoryManager (`src/domain/services/InventoryManager.ts`)
- **4-State FSM:** `IN_STOCK ↔ LOW_STOCK ↔ OUT_OF_STOCK → DISCONTINUED`
- **9 Legal Transitions:** Each state can transition to any other non-terminal state
- **DISCONTINUED** is terminal (no outgoing transitions)
- **Transaction Logging:** Every mutation records an `InventoryTransaction`

### SKU Combinatorics (`src/domain/value-objects/SKU.ts`)
- Cartesian product of Sizes × Materials × Gemstones
- Generates unique SKU codes for each variant combination

---

## 7. API Routes

All routes return standardized envelope: `{ success, data?, error?, timestamp }`

### Public Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/signup` | POST | Create new user account |
| `/api/auth/login` | POST | Sign in with email/password |
| `/api/auth/logout` | POST | Sign out current session |
| `/api/products` | GET | List active products with filtering |
| `/api/products/[id]` | GET | Single product by ID or slug |
| `/api/invoices` | POST | Create invoice from cart |

### Admin Routes (require ADMIN role + email domain)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/products` | GET/POST | List / Create products |
| `/api/admin/products/[id]` | PATCH | Update/archive product |
| `/api/admin/variants` | POST | Create variant |
| `/api/admin/variants/[id]` | PATCH | Update variant |
| `/api/admin/inventory` | GET | Dashboard inventory summary |
| `/api/admin/invoices` | GET | List all invoices |

---

## 8. Frontend UI Components

**20+ Production Components with Luxury Tailwind Theme:**

### Core UI (`src/presentation/components/ui/`)
| Component | Description |
|-----------|-------------|
| `Button` | Variants: primary, secondary, outline, ghost, danger; sizes sm/md/lg |
| `Input` | With error state, helper text, label; uses `React.useId()` for stable DOM IDs |
| `Modal` | Accessible dialog with backdrop, close button, keyboard handling |
| `Card` | Container with optional padding, shadow, hover effects |
| `Table` | Sortable columns, striped rows, empty state, clickable rows |
| `Badge` | Color variants for status indicators |
| `Toast` | Notification system with success/error/info/warning variants |

### Product Components (`src/presentation/components/product/`)
| Component | Description |
|-----------|-------------|
| `ProductCard` | Image, name, price, badge |
| `ProductGrid` | Responsive grid layout |
| `ProductDetail` | Full product view with variant selector |
| `VariantSelector` | Size/material/gemstone options |

### Barcode Components (`src/presentation/components/barcode/`)
| Component | Description |
|-----------|-------------|
| `BarcodeSVG` | Inline SVG rendering with XSS-safe humanReadable |

### Hero Components (`src/presentation/components/hero/`)
| Component | Description |
|-----------|-------------|
| `HeroSection` | Landing page hero with CTA |
| `FeaturedProducts` | Featured products grid |

### Admin Components (`src/presentation/components/admin/`)
| Component | Description |
|-----------|-------------|
| `DashboardStats` | Summary cards (total products, revenue, etc.) |
| `ProductForm` | *(placeholder — needs build)* |
| `VariantTable` | Variants listing with status |
| `BarcodePanel` | Barcode generator UI |
| `InventoryTracker` | Inventory status dashboard |

### Search Components
| Component | Description |
|-----------|-------------|
| `SearchOverlay` | Modal search interface |
| `SearchResults` | Search results with highlighting |
| `CatalogFilters` | Category, material, price filters |
| `CatalogSort` | Sort options dropdown |
| `ContactForm` | Customer inquiry form |

---

## 9. Pages & Routes

### Public Pages (`src/app/(public)/`)
| Route | Page |
|-------|------|
| `/` | Landing page with Hero + Featured Products |
| `/catalog` | Product catalog with filters + sorting |
| `/catalog/[slug]` | Product detail page |
| `/contact` | Contact form |
| `/search` | Search results |

### Auth Pages (`src/app/auth/`)
| Route | Page |
|-------|------|
| `/auth/login` | Login form with Zod validation |
| `/auth/signup` | Signup form |

### Admin Pages (`src/app/(admin)/`)
| Route | Page |
|-------|------|
| `/dashboard` | Admin dashboard with stats |
| `/dashboard/products` | Product management *(CRUD form needs build)* |
| `/dashboard/barcodes` | Barcode generator |
| `/dashboard/inventory` | Inventory tracker |
| `/dashboard/invoices` | Invoice management |

---

## 10. Barcode Generator Engine

**File:** `src/domain/services/BarcodeGenerator.ts`

### Supported Formats
- **Code-128B** — Primary format, for internal/SKU tracking
- **EAN-13** — Secondary format, for retail POS compatibility

### Algorithms

#### EAN-13 Generation
```
Format: [system_code:2][productIndex:5][variantIndex:5][check_digit:1]
- System code: "07" (internal use prefix)
- productIndex: 0-99999
- variantIndex: 0-9
- Check digit: weighted sum mod 10
- Output: 13-digit string
```

#### EAN-13 Pattern Encoding
```
1. Build 95-module sequence:
   - Start guard: 1-0-1 (3 modules)
   - Left half: 6 digits × 7 modules = 42 (L/G parity)
   - Middle guard: 0-1-0-1-0 (5 modules)
   - Right half: 6 digits × 7 modules = 42 (R parity)
   - End guard: 1-0-1 (3 modules)

2. Run-length encode into bar/space element widths:
   - Consecutive 1s → one bar element
   - Consecutive 0s → one space element

3. Validate: exactly 95 modules total
```

#### Code-128B Encoding
```
1. Convert each char to value (ASCII - 32)
2. Prepend Start Code B (value 104)
3. Compute checksum: (start + Σ((i+1) × value_i)) mod 103
4. Append Stop code (value 106, 13 modules wide)
5. Encode each symbol as 11-bit pattern (13-bit for stop)
6. Bit alternation: even bits → bars, odd bits → spaces
```

### Complexity
- EAN-13 generation: O(1) for check digit, O(13) for encoding
- Code-128B generation: O(n) where n = data length (max 48 chars)
- Both are fully deterministic

---

## 11. Inventory State Machine

**File:** `src/domain/services/InventoryManager.ts`

### States & Transitions

```
                    ┌──────────┐
                    │IN_STOCK  │
                    └────┬─────┘
                    ┌────┴─────┐
               ┌────▼────┐  ┌──▼────────┐
               │LOW_STOCK│  │OUT_OF_STOCK│
               └────┬────┘  └──┬─────────┘
                    └────┬─────┘
                    ┌────▼──────┐
                    │DISCONTINUED│ (terminal)
                    └───────────┘
```

- **9 legal transitions:** Any non-terminal state can transition to any other
- **DISCONTINUED** is a terminal state — no outgoing transitions allowed
- Every mutation creates an `InventoryTransaction` record
- Methods: `restock()`, `sell()`, `adjustStock()`, `discontinue()`

---

## 12. Bugs Fixed

### Barcode Generator Root Cause Fixes

1. **CODE128_ENCODING_TABLE: Wrong indices (103-106)**
   - **Before:** Start Code B at 103, Stop at 105, missing Start A/C
   - **After:** Start A=103, Start B=104, Start C=105, Stop=106 — proper alignment
   - **File:** `src/shared/constants/index.ts`

2. **EAN-13 generateEAN13(): Wrong padding**
   - **Before:** `productIndex.padStart(4, "0")` → 12-digit output
   - **After:** `productIndex.padStart(5, "0")` → 13-digit output
   - **File:** `src/domain/services/BarcodeGenerator.ts`

3. **EAN-13 encodeEAN13ToPattern(): Wrong encoding algorithm**
   - **Before:** Alternating bit-by-bit push to bars/spaces arrays (producing 108 modules)
   - **After:** Build full 95-module sequence, then run-length encode into bar/space element widths
   - **File:** `src/domain/services/BarcodeGenerator.ts`

4. **Code-128B encodeCode128BToPattern(): Wrong bar/space parity**
   - **Before:** Sum-based comparison (`barLen <= spaceLen`) for alternation
   - **After:** Bit-position parity from MSB (even = bar, odd = space)
   - **File:** `src/domain/services/BarcodeGenerator.ts`

5. **Missing balanced array guard for Code-128B**
   - **After:** Added `while (spaces.length < bars.length - 1) spaces.push(0)` for stability
   - **File:** `src/domain/services/BarcodeGenerator.ts`

### Security Fixes

6. **XSS in SVG barcode rendering**
   - **Before:** Direct interpolation of `pattern.humanReadable` into SVG `<text>`
   - **After:** XML entity escaping (`&`, `<`, `>`, `"`, `'`) before injection
   - **File:** `src/shared/utils/barcode-utils.ts`

7. **Input.tsx: Math.random() for DOM IDs**
   - **Before:** `Math.random().toString(36).substr(2, 9)` — unstable, hydration mismatch risk
   - **After:** `React.useId()` — stable, SSR-compatible
   - **File:** `src/presentation/components/ui/Input.tsx`

8. **Table.tsx: Wrong background striping**
   - **Before:** CSS class on `<tbody>` (`even:bg-charcoal-50`) — didn't work per-row
   - **After:** Conditional class on each `<tr>` (`striped && rowIndex % 2 === 1`)
   - **File:** `src/presentation/components/ui/Table.tsx`

### Code Quality Fixes

9. **useAdmin.ts: Hardcoded credentials**
   - **Before:** `DEMO_CREDENTIALS` with `admin@luxejewels.com / admin123`
   - **After:** Wired to Supabase Auth with `@aviora.com` email check (TODO for production)
   - **File:** `src/presentation/hooks/useAdmin.ts`

10. **products/[id]/route.ts: Separate UUID/slug queries**
    - **Before:** Two separate `findUnique()` calls with if/else
    - **After:** Single `findFirst()` with `OR: [{ id }, { slug }]`
    - **File:** `src/app/api/products/[id]/route.ts`

11. **InventoryManager.discontinue(): Terminal state entry**
    - **Before:** Called `applyDelta(variant, 0, ...)` which didn't set DISCONTINUED status
    - **After:** Explicitly creates transaction with `status = DISCONTINUED`
    - **File:** `src/domain/services/InventoryManager.ts`

---

## 13. Testing

**Framework:** Vitest v2.1.9

### Test Results: 32/32 Passing

**InventoryManager Tests (17 tests):**
- Initial state is OUT_OF_STOCK
- Restock transitions to IN_STOCK
- Sell from IN_STOCK
- Sell from LOW_STOCK → OUT_OF_STOCK
- Cannot sell from OUT_OF_STOCK
- Cannot sell from DISCONTINUED
- Adjust stock quantities
- Discontinue from any state
- Cannot discontinue from DISCONTINUED
- Discontinued is terminal
- Prevent invalid transitions from DISCONTINUED
- Restock after discontinue (should fail)
- Multiple restock and sell operations
- Edge: large quantities
- Edge: zero quantity edge case
- Edge: negative quantity (should fail)
- Inventory transaction logging

**BarcodeGenerator Tests (15 tests):**
- EAN-13: 13-digit output
- EAN-13: starts with system code '07'
- EAN-13: valid checksum
- EAN-13: deterministic output
- EAN-13: different inputs → different barcodes
- EAN-13: maximum bounds (99999, 9)
- Code-128B: 13-digit numeric string
- Code-128B: deterministic
- Code-128B: throw on empty string
- Code-128B: throw on non-printable ASCII
- Code-128B: accept all printable ASCII
- EAN-13 Pattern: valid bar/space arrays
- EAN-13 Pattern: reject invalid length
- Render: complete output
- Render: deterministic

### TypeScript: Zero Errors
```
npx tsc --noEmit → PASS (exit code 0)
```

---

## 14. Deployment Status

### Database
- **Supabase Project:** `axosbugloarfyrzcucdj.supabase.co`
- **Region:** eu-central-1 (Frankfurt)
- **Database URL:** PostgreSQL via Supavisor pooler (IPv6-only direct, pooler for IPv4)
- **Tables Created:** users, sessions, products, product_variants, invoices, invoice_items
- **Status:** ✅ Tables exist, admin user seeded

### Authentication
- **Auth Provider:** Supabase Auth
- **Admin User:** `admin@avoria.com` (created in Supabase Auth dashboard)
- **Password:** Set by user in Supabase Auth dashboard
- **Login URL:** `http://localhost:3000/auth/login`
- **Status:** ✅ Login API works (tested), Prisma dependency removed for auth

### Known Issues
1. **Prisma database connection from local machine:** The Supabase database host (`db.axosbugloarfyrzcucdj.supabase.co`) only has an IPv6 AAAA record. IPv6 is disabled on the development machine, and the Supavisor pooler connection requires configuration. **Workaround:** Auth and other features that don't need Prisma work via Supabase Auth API directly. SQL operations can be run via Supabase SQL Editor.

2. **Admin product CRUD form UI:** Not yet built — placeholder on `/dashboard/products`.

### Release
- **v1.0.0** released on GitHub
- **PR #1** merged `dev` → `main`
- **URL:** `https://github.com/Ahmadkhayatt/aviora-project/releases/tag/v1.0.0`

---

## 15. Next Steps

### Immediate
1. ✅ **Login works** — restart dev server on port 3000, login with `admin@avoria.com`
2. Build the **Product Management form** (`ProductForm.tsx`) for adding/editing products from the admin panel
3. Set up **image hosting** (Supabase Storage or Cloudinary)

### Short-term
4. Fix Prisma connection from local machine (enable IPv6 or configure pooler properly)
5. Create remaining admin CRUD forms (variants, invoices)
6. Set up proper Supabase service role key for admin operations

### Medium-term
7. Deploy to Vercel
8. Add payment integration (Stripe)
9. Add email notifications (Order confirmations)
10. Add product reviews/ratings

### Long-term
11. SEO optimization
12. Analytics integration
13. Multi-language support
14. Mobile app (React Native)

---

*Report generated: July 4, 2026*
*Project: AVIORA — Silver Jewellery E-Commerce Platform*
