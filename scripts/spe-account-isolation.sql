-- SPE account isolation migration. Back up the database before applying.
ALTER TABLE products ADD COLUMN IF NOT EXISTS owner_id integer REFERENCES users(id);
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS owner_id integer REFERENCES users(id);
CREATE INDEX IF NOT EXISTS products_owner_id_idx ON products(owner_id);
CREATE INDEX IF NOT EXISTS stock_movements_owner_id_idx ON stock_movements(owner_id);
