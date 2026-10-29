import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { requireAuth, requireSameOrigin } from "../lib/auth";

const router: IRouter = Router();
router.use(requireSameOrigin, requireAuth);
type Action = "REUSE" | "RECYCLE" | "DISPOSE";
const actions: Action[] = ["REUSE", "RECYCLE", "DISPOSE"];

router.get("/environment/actions", async (_req, res) => {
  const ownerId = res.locals.authUser.id as number;
  const result = await pool.query(
    `SELECT e.id, e.product_id AS "productId", p.name AS "productName",
       e.action, e.quantity, e.notes, e.created_at AS "createdAt"
       FROM environmental_actions e
       JOIN products p ON p.id = e.product_id AND p.owner_id = e.owner_id
       WHERE e.owner_id = $1 ORDER BY e.created_at DESC, e.id DESC LIMIT 300`,
    [ownerId],
  );
  res.json(result.rows);
});

router.post("/environment/actions", async (req, res) => {
  const ownerId = res.locals.authUser.id as number;
  const { productId, action, quantity, notes } = req.body ?? {};
  if (!Number.isSafeInteger(productId) || productId <= 0 ||
      !actions.includes(action) || !Number.isSafeInteger(quantity) || quantity <= 0 ||
      (notes != null && (typeof notes !== "string" || notes.length > 500))) {
    res.status(400).json({ error: "Informe material, ação e quantidade inteira positiva." });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const product = await client.query(
      "SELECT id, current_stock FROM products WHERE id = $1 AND owner_id = $2 AND active = true FOR UPDATE",
      [productId, ownerId],
    );
    if (!product.rowCount) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Material não encontrado nesta conta." });
      return;
    }
    if (quantity > product.rows[0].current_stock) {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "Quantidade superior ao estoque disponível." });
      return;
    }
    // Reaproveitamento, reciclagem e descarte retiram unidades do estoque disponível.
    await client.query("UPDATE products SET current_stock = current_stock - $1 WHERE id = $2 AND owner_id = $3", [quantity, productId, ownerId]);
    const result = await client.query(
      `INSERT INTO environmental_actions (owner_id, product_id, action, quantity, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, action, quantity, notes, created_at AS "createdAt"`,
      [ownerId, productId, action, quantity, notes?.trim() || null],
    );
    // Keep the regular movement history and reports consistent.
    await client.query(
      `INSERT INTO stock_movements (owner_id, product_id, type, quantity, stock_before, stock_after, movement_date, reason, notes)
       VALUES ($1, $2, 'EXIT', $3, $4, $5, NOW(), $6, $7)`,
      [ownerId, productId, quantity, product.rows[0].current_stock,
       product.rows[0].current_stock - quantity,
       action === "REUSE" ? "Reaproveitamento" : action === "RECYCLE" ? "Reciclagem" : "Descarte",
       notes?.trim() || null],
    );
    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

export default router;
