-- Enable Row Level Security on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_items" ENABLE ROW LEVEL SECURITY;

-- users policies
-- Users can read their own profile, or admins can read all
CREATE POLICY "Users can read own profile" ON "users"
FOR SELECT USING (
  auth.uid()::text = id 
  OR (SELECT role FROM "users" WHERE id = auth.uid()::text) = 'ADMIN'
);

-- Users can update their own profile, or admins can update all
CREATE POLICY "Users can update own profile" ON "users"
FOR UPDATE USING (
  auth.uid()::text = id 
  OR (SELECT role FROM "users" WHERE id = auth.uid()::text) = 'ADMIN'
);

-- products & product_variants policies
-- Anyone can read active products (or admins can read all)
CREATE POLICY "Public can view active products" ON "products"
FOR SELECT USING (
  status = 'ACTIVE'
  OR (SELECT role FROM "users" WHERE id = auth.uid()::text) = 'ADMIN'
);

CREATE POLICY "Public can view active variants" ON "product_variants"
FOR SELECT USING (
  status != 'OUT_OF_STOCK' -- Adjust as needed, but usually active products are readable
  OR (SELECT role FROM "users" WHERE id = auth.uid()::text) = 'ADMIN'
);

-- Only admins can insert/update/delete products
CREATE POLICY "Admins can insert products" ON "products"
FOR INSERT WITH CHECK ((SELECT role FROM "users" WHERE id = auth.uid()::text) = 'ADMIN');

CREATE POLICY "Admins can update products" ON "products"
FOR UPDATE USING ((SELECT role FROM "users" WHERE id = auth.uid()::text) = 'ADMIN');

CREATE POLICY "Admins can delete products" ON "products"
FOR DELETE USING ((SELECT role FROM "users" WHERE id = auth.uid()::text) = 'ADMIN');

CREATE POLICY "Admins can insert variants" ON "product_variants"
FOR INSERT WITH CHECK ((SELECT role FROM "users" WHERE id = auth.uid()::text) = 'ADMIN');

CREATE POLICY "Admins can update variants" ON "product_variants"
FOR UPDATE USING ((SELECT role FROM "users" WHERE id = auth.uid()::text) = 'ADMIN');

CREATE POLICY "Admins can delete variants" ON "product_variants"
FOR DELETE USING ((SELECT role FROM "users" WHERE id = auth.uid()::text) = 'ADMIN');

-- invoices & invoice_items policies
-- Users can see their own invoices, admins can see all
CREATE POLICY "Users can view own invoices" ON "invoices"
FOR SELECT USING (
  auth.uid()::text = "userId"
  OR (SELECT role FROM "users" WHERE id = auth.uid()::text) = 'ADMIN'
);

-- Users can create invoices for themselves
CREATE POLICY "Users can create own invoices" ON "invoices"
FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- Only admins can update invoices (status changes, etc)
CREATE POLICY "Admins can update invoices" ON "invoices"
FOR UPDATE USING ((SELECT role FROM "users" WHERE id = auth.uid()::text) = 'ADMIN');

-- Users can see their own invoice items via invoice join
CREATE POLICY "Users can view own invoice items" ON "invoice_items"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "invoices" 
    WHERE "invoices".id = "invoice_items"."invoiceId" 
    AND "invoices"."userId" = auth.uid()::text
  )
  OR (SELECT role FROM "users" WHERE id = auth.uid()::text) = 'ADMIN'
);

-- Users can create invoice items for their own invoices
CREATE POLICY "Users can create own invoice items" ON "invoice_items"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "invoices" 
    WHERE "invoices".id = "invoice_items"."invoiceId" 
    AND "invoices"."userId" = auth.uid()::text
  )
);

-- Schema cleanups
ALTER TABLE "users" DROP COLUMN IF EXISTS "passwordHash";
DROP TABLE IF EXISTS "sessions" CASCADE;
