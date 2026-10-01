/*
# Create products and stock_movements tables

## Overview
Creates the two core tables for the SCPE inventory management system.
This is a single-tenant app with no authentication — all data is shared/public.

## New Tables

### products
- id (serial, primary key)
- code (text, unique, not null) — product SKU/code
- name (text, not null) — product name
- description (text, nullable) — optional description
- sale_price (numeric 12,2, not null) — selling price
- cost_price (numeric 12,2, nullable) — purchase cost
- current_stock (integer, not null, default 0) — current quantity in stock
- minimum_stock (integer, not null, default 0) — reorder threshold
- active (boolean, not null, default true) — whether the product is active
- created_at (timestamptz, not null, default now())
- updated_at (timestamptz, not null, default now())

### stock_movements
- id (serial, primary key)
- product_id (integer, not null, references products(id)) — which product moved
- type (enum: ENTRY, EXIT, not null) — direction of movement
- quantity (integer, not null) — how many units
- unit_price (numeric 12,2, nullable) — price per unit at time of movement
- stock_before (integer, not null) — stock before this movement
- stock_after (integer, not null) — stock after this movement
- movement_date (timestamptz, not null, default now()) — when the movement occurred
- reason (text, nullable) — short reason
- notes (text, nullable) — longer notes
- created_at (timestamptz, not null, default now())

## Indexes
- products_code_unique — unique index on products.code
- stock_movements_product_id_idx — index on stock_movements.product_id for joins
- stock_movements_movement_date_idx — index on stock_movements.movement_date for date filtering

## Security
- RLS enabled on both tables.
- Policies allow anon + authenticated full CRUD (single-tenant, no auth, public data).
- This is intentional: the app has no sign-in screen and all data is shared.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_type') THEN
    CREATE TYPE movement_type AS ENUM ('ENTRY', 'EXIT');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  sale_price numeric(12, 2) NOT NULL,
  cost_price numeric(12, 2),
  current_stock integer NOT NULL DEFAULT 0,
  minimum_stock integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS products_code_unique ON products(code);

CREATE TABLE IF NOT EXISTS stock_movements (
  id serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id),
  type movement_type NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(12, 2),
  stock_before integer NOT NULL,
  stock_after integer NOT NULL,
  movement_date timestamptz NOT NULL DEFAULT now(),
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_movements_product_id_idx ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS stock_movements_movement_date_idx ON stock_movements(movement_date);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Products: anon + authenticated CRUD (single-tenant, no auth)
DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- Stock movements: anon + authenticated CRUD (single-tenant, no auth)
DROP POLICY IF EXISTS "anon_select_movements" ON stock_movements;
CREATE POLICY "anon_select_movements" ON stock_movements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_movements" ON stock_movements;
CREATE POLICY "anon_insert_movements" ON stock_movements FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_movements" ON stock_movements;
CREATE POLICY "anon_update_movements" ON stock_movements FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_movements" ON stock_movements;
CREATE POLICY "anon_delete_movements" ON stock_movements FOR DELETE
  TO anon, authenticated USING (true);

-- updated_at auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
