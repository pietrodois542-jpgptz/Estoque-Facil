-- Execute once in the PROJETEC development database (not the original TCC).
-- Back up the database before applying.
CREATE TABLE IF NOT EXISTS environmental_actions (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  action TEXT NOT NULL CHECK (action IN ('REUSE','RECYCLE','DISPOSE')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS environmental_actions_owner_date_idx ON environmental_actions(owner_id, created_at DESC);
