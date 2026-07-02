# AVIORA — Backend Infrastructure Architecture Addendum

## 1. Executive Summary

**Project:** AVIORA Luxury Jewelry Platform  
**Stack Addition:** PostgreSQL (Supabase) + Prisma ORM 5.22 + Supabase Auth + RBAC  
**Architecture Pattern:** Server Actions + API Routes with middleware-enforced RBAC  
**Date:** 2026-07-02 | **Version:** 2.0.0  

This addendum integrates a complete backend infrastructure into the existing Clean Architecture frontend, adding persistent storage, authentication, authorization, and CRUD operations.

---

## 2. Database Schema — Entity Relationship Diagram

```
┌──────────┐       ┌────────────────┐       ┌───────────────┐
│   User   │1──N──>│    Session     │       │   Product     │
│          │       │                │       │               │
│ id (PK)  │       │ id (PK)        │       │ id (PK)       │
│ email    │       │ userId (FK)    │       │ name          │
│ role     │       │ token (UQ)     │       │ slug (UQ)     │
│ isActive │       │ expiresAt      │       │ category      │
└────┬─────┘       └────────────────┘       │ basePrice     │
     │                                       │ status        │
     │1                                     └──────┬────────┘
     │                                            │
     │                                            │1
     │                                            │
     │                                            │
     │      ┌──────────────────┐                  │
     │      │   Invoice        │                  │
     │      │                  │                  │
     │      │ id (PK)          │                  │
     │      │ invoiceNo (UQ)   │                  │
     └──────│ userId (FK)      │                  │
            │ totalAmount      │                  │
            │ status           │                  │
            └────────┬─────────┘                  │
                     │                            │
                     │1                           │N
                     │                            │
              ┌──────▼──────────┐       ┌────────▼────────┐
              │   InvoiceItem   │N──────│ ProductVariant  │
              │                 │       │                  │
              │ invoiceId (FK)  │       │ id (PK)          │
              │ variantId (FK)  │       │ productId (FK)   │
              │ productName     │       │ sku (UQ)         │
              │ quantity        │       │ barcode (UQ)     │
              │ lineTotal       │       │ quantity          │
              └─────────────────┘       │ status           │
                                        └──────────────────┘
```

## 3. Authentication & Authorization Model

### 3.1 Role Hierarchy

```
CUSTOMER (0) → Browse catalog, view own invoices
ADMIN (1)    → Full CRUD on products/variants, manage inventory, view all invoices
```

### 3.2 Authentication Flow

```
[User] → [Login Form] 
  → POST /api/auth/login
    → supabase.auth.signInWithPassword()
    → Create session in Supabase + Prisma sessions table
    → Set auth cookies
  → Redirect to dashboard (ADMIN) or profile (CUSTOMER)

[Middleware] → Every request
  → Refresh Supabase session cookies
  → Check route against admin patterns
  → If admin route + valid admin email → allow
  → If admin route + no auth → redirect /auth/login
  → If admin route + non-admin email → redirect /
```

### 3.3 Admin Email Restriction

```
ADMIN_EMAIL_DOMAINS env var controls which email domains can access admin.
Default: "avoria.com,admin.avoria.com"
Only users with @avoria.com or @admin.avoria.com emails get ADMIN role access.
All other authenticated users are blocked from /dashboard/* routes.
```

## 4. API Route Architecture

### 4.1 Route Table

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | `/api/auth/login` | Public | — | Authenticate user |
| POST | `/api/auth/signup` | Public | — | Register new user |
| POST | `/api/auth/logout` | Auth | — | End session |
| GET | `/api/products` | Public | — | List active products |
| GET | `/api/products/[id]` | Public | — | Get product with variants |
| POST | `/api/admin/products` | Auth | ADMIN | Create product |
| PUT | `/api/admin/products/[id]` | Auth | ADMIN | Update product |
| DELETE | `/api/admin/products/[id]` | Auth | ADMIN | Delete product |
| POST | `/api/admin/variants` | Auth | ADMIN | Create variant |
| PUT | `/api/admin/variants/[id]` | Auth | ADMIN | Update variant |
| GET | `/api/admin/inventory` | Auth | ADMIN | Get inventory summary |
| GET | `/api/invoices` | Auth | — | Get user's invoices |
| POST | `/api/invoices` | Auth | — | Create invoice |
| GET | `/api/admin/invoices` | Auth | ADMIN | All invoices |

### 4.2 API Response Envelope

```typescript
interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly timestamp: string;
}
```

## 5. Database Interaction Patterns

### 5.1 Prisma Client Singleton

File: `src/lib/prisma.ts`
- Single PrismaClient instance
- Prevents hot-reload proliferation in development
- Query logging in dev mode only

### 5.2 Error Handling

```typescript
// All API routes wrap handlers:
try {
  // operation
  return NextResponse.json({ success: true, data: result, timestamp: now });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle unique constraint violations, foreign key errors
  }
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 500 }
  );
}
```

## 6. File Inventory (New/Modified)

### New Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema (6 models, 4 enums) |
| `prisma/seed.ts` | Seed data (admin + 3 products + variants) |
| `.env.template` | Environment variable template |
| `.env.local` | Local environment variables |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/auth.ts` | Auth/role helpers |
| `src/utils/supabase/server.ts` | Supabase server client |
| `src/utils/supabase/client.ts` | Supabase browser client |
| `src/utils/supabase/middleware.ts` | Supabase middleware client |
| `src/middleware.ts` | Next.js middleware (route protection) |
| `src/app/auth/login/page.tsx` | Login page |
| `src/app/auth/signup/page.tsx` | Signup page |
| `src/app/api/auth/login/route.ts` | Login API |
| `src/app/api/auth/signup/route.ts` | Signup API |
| `src/app/api/auth/logout/route.ts` | Logout API |
| `src/app/api/products/route.ts` | Products list API |
| `src/app/api/products/[id]/route.ts` | Product detail API |
| `src/app/api/admin/products/route.ts` | Admin product CRUD |
| `src/app/api/admin/products/[id]/route.ts` | Admin product update/delete |
| `src/app/api/admin/inventory/route.ts` | Admin inventory |

### Modified Files

| File | Change |
|------|--------|
| `package.json` | Added Prisma scripts, Supabase + Prisma deps |
| `src/app/(admin)/layout.tsx` | Add auth check |
| `src/shared/types/index.ts` | Optionally add Supabase DB types |

## 7. Security Checklist

- [x] Password hashing via Supabase Auth (bcrypt)
- [x] Session token rotation via Supabase
- [x] Admin routes protected by middleware (email domain check)
- [x] CSRF protection via Supabase cookie-based auth
- [x] Input validation via Zod on all API routes
- [x] SQL injection prevention via Prisma parameterized queries
- [x] XSS prevention via React/Next.js auto-escaping
- [x] Rate limiting via Supabase Auth built-in
- [ ] Row-Level Security (RLS) policies in Supabase (future)
- [ ] API rate limiting via middleware (future)

---

**End of Backend Architecture Addendum.**  
Consumed by the @elite-fullstack-engineer for implementation.
