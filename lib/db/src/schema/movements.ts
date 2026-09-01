import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { productsTable } from "./products";

export const movementTypeEnum = pgEnum("movement_type", ["ENTRY", "EXIT"]);

export const stockMovementsTable = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
  type: movementTypeEnum("type").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", {
    precision: 12,
    scale: 2,
    mode: "number",
  }),
  stockBefore: integer("stock_before").notNull(),
  stockAfter: integer("stock_after").notNull(),
  movementDate: timestamp("movement_date", { withTimezone: true })
    .notNull()
    .defaultNow(),
  reason: text("reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type StockMovement = typeof stockMovementsTable.$inferSelect;
export type NewStockMovement = typeof stockMovementsTable.$inferInsert;