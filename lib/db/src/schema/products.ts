import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const productsTable = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    salePrice: numeric("sale_price", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).notNull(),
    costPrice: numeric("cost_price", {
      precision: 12,
      scale: 2,
      mode: "number",
    }),
    currentStock: integer("current_stock").notNull().default(0),
    minimumStock: integer("minimum_stock").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    codeUnique: uniqueIndex("products_code_unique").on(table.code),
  }),
);

export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;