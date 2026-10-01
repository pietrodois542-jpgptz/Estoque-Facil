/*
# Create RPC function for atomic stock movements

## Overview
The original backend uses a database transaction with SELECT FOR UPDATE to safely
create stock movements and update product stock atomically. Since the frontend
now talks to Supabase directly, we replicate this logic as a SECURITY DEFINER
RPC function so it runs with elevated privileges and is atomic.

## Functions

### create_movement(params)
- Takes: product_id, movement_type ('ENTRY' or 'EXIT'), quantity, unit_price, movement_date, reason, notes
- Locks the product row with SELECT FOR UPDATE
- Validates: product exists, product is active, sufficient stock for EXIT
- Computes stock_before and stock_after
- Updates product.current_stock
- Inserts stock_movements row
- Returns the new movement row with product_name included
- Throws exceptions with descriptive messages on validation failures

## Security
- SECURITY DEFINER — runs with the function owner's privileges (needed for the
  atomic transaction + row lock to work via the anon key)
- EXECUTE granted to anon, authenticated
*/

CREATE OR REPLACE FUNCTION create_movement(
  p_product_id integer,
  p_movement_type text,
  p_quantity integer,
  p_unit_price numeric DEFAULT NULL,
  p_movement_date timestamptz DEFAULT now(),
  p_reason text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_stock_before integer;
  v_stock_after integer;
  v_movement_id integer;
  v_result json;
BEGIN
  -- Validate movement type
  IF p_movement_type NOT IN ('ENTRY', 'EXIT') THEN
    RAISE EXCEPTION 'Tipo de movimentação inválido: %', p_movement_type;
  END IF;

  -- Lock and fetch the product
  SELECT * INTO v_product FROM products WHERE id = p_product_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado.';
  END IF;

  IF NOT v_product.active THEN
    RAISE EXCEPTION 'Produtos inativos não podem ser movimentados.';
  END IF;

  v_stock_before := v_product.current_stock;

  IF p_movement_type = 'ENTRY' THEN
    v_stock_after := v_stock_before + p_quantity;
  ELSE
    v_stock_after := v_stock_before - p_quantity;
    IF p_quantity > v_stock_before THEN
      RAISE EXCEPTION 'Estoque insuficiente. Disponível: % unidade(s).', v_stock_before;
    END IF;
  END IF;

  -- Update product stock
  UPDATE products SET current_stock = v_stock_after WHERE id = p_product_id;

  -- Insert movement record
  INSERT INTO stock_movements (
    product_id, type, quantity, unit_price,
    stock_before, stock_after, movement_date, reason, notes
  )
  VALUES (
    p_product_id, p_movement_type::movement_type, p_quantity, p_unit_price,
    v_stock_before, v_stock_after, p_movement_date, p_reason, p_notes
  )
  RETURNING id INTO v_movement_id;

  -- Build result JSON matching the API response shape
  SELECT json_build_object(
    'id', sm.id,
    'productId', sm.product_id,
    'productName', p.name,
    'type', sm.type,
    'quantity', sm.quantity,
    'unitPrice', sm.unit_price,
    'stockBefore', sm.stock_before,
    'stockAfter', sm.stock_after,
    'movementDate', sm.movement_date,
    'reason', sm.reason,
    'notes', sm.notes,
    'createdAt', sm.created_at
  )
  INTO v_result
  FROM stock_movements sm
  JOIN products p ON p.id = sm.product_id
  WHERE sm.id = v_movement_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION create_movement TO anon, authenticated;
