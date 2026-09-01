import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db, productsTable, stockMovementsTable } from "@workspace/db";

export type MovementKind = "ENTRY" | "EXIT";

export type ProductInput = {
  code: string;
  name: string;
  description?: string | null;
  salePrice: number;
  costPrice?: number | null;
  initialStock?: number;
  minimumStock: number;
};

export type ProductUpdate = Partial<
  Omit<ProductInput, "initialStock">
> & { description?: string | null; costPrice?: number | null };

export type MovementInput = {
  productId: number;
  quantity: number;
  unitPrice?: number | null;
  movementDate: Date;
  reason?: string | null;
  notes?: string | null;
};

function mapProduct(product: typeof productsTable.$inferSelect) {
  return product;
}

async function findProduct(productId: number) {
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));
  return product;
}

export async function listProducts(filters: {
  search?: string;
  lowStock?: boolean;
  active?: boolean;
}) {
  const conditions = [];
  if (filters.search) {
    const search = `%${filters.search}%`;
    conditions.push(
      or(ilike(productsTable.name, search), ilike(productsTable.code, search)),
    );
  }
  if (filters.lowStock) {
    conditions.push(
      sql`${productsTable.currentStock} <= ${productsTable.minimumStock}`,
    );
  }
  if (filters.active !== undefined) {
    conditions.push(eq(productsTable.active, filters.active));
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(productsTable.name);
  return products.map(mapProduct);
}

export async function getProduct(productId: number) {
  const product = await findProduct(productId);
  return product ? mapProduct(product) : undefined;
}

export async function createProduct(data: ProductInput) {
  return db.transaction(async (tx) => {
    const initialStock = data.initialStock ?? 0;
    const [product] = await tx
      .insert(productsTable)
      .values({
        code: data.code.trim(),
        name: data.name.trim(),
        description: data.description ?? null,
        salePrice: data.salePrice,
        costPrice: data.costPrice ?? null,
        currentStock: initialStock,
        minimumStock: data.minimumStock,
      })
      .returning();

    if (initialStock > 0) {
      await tx.insert(stockMovementsTable).values({
        productId: product.id,
        type: "ENTRY",
        quantity: initialStock,
        unitPrice: data.costPrice ?? null,
        stockBefore: 0,
        stockAfter: initialStock,
        movementDate: new Date(),
        reason: "Estoque inicial",
        notes: "Saldo informado no cadastro do produto",
      });
    }

    return mapProduct(product);
  });
}

export async function updateProduct(productId: number, data: ProductUpdate) {
  const updates: Record<string, unknown> = {};
  if (data.code !== undefined) updates.code = data.code.trim();
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.description !== undefined) updates.description = data.description;
  if (data.salePrice !== undefined) updates.salePrice = data.salePrice;
  if (data.costPrice !== undefined) updates.costPrice = data.costPrice;
  if (data.minimumStock !== undefined) {
    updates.minimumStock = data.minimumStock;
  }

  if (Object.keys(updates).length === 0) {
    return getProduct(productId);
  }

  const [product] = await db
    .update(productsTable)
    .set(updates)
    .where(eq(productsTable.id, productId))
    .returning();
  return product ? mapProduct(product) : undefined;
}

export async function toggleProductStatus(productId: number, active: boolean) {
  const [product] = await db
    .update(productsTable)
    .set({ active })
    .where(eq(productsTable.id, productId))
    .returning();
  return product ? mapProduct(product) : undefined;
}

function movementSelection() {
  return {
    id: stockMovementsTable.id,
    productId: stockMovementsTable.productId,
    productName: productsTable.name,
    type: stockMovementsTable.type,
    quantity: stockMovementsTable.quantity,
    unitPrice: stockMovementsTable.unitPrice,
    stockBefore: stockMovementsTable.stockBefore,
    stockAfter: stockMovementsTable.stockAfter,
    movementDate: stockMovementsTable.movementDate,
    reason: stockMovementsTable.reason,
    notes: stockMovementsTable.notes,
    createdAt: stockMovementsTable.createdAt,
  };
}

export async function listMovements(filters: {
  productId?: number;
  type?: MovementKind;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const conditions = [];
  if (filters.productId !== undefined) {
    conditions.push(eq(stockMovementsTable.productId, filters.productId));
  }
  if (filters.type !== undefined) {
    conditions.push(eq(stockMovementsTable.type, filters.type));
  }
  if (filters.from) {
    conditions.push(gte(stockMovementsTable.movementDate, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(stockMovementsTable.movementDate, filters.to));
  }

  const query = db
    .select(movementSelection())
    .from(stockMovementsTable)
    .innerJoin(
      productsTable,
      eq(stockMovementsTable.productId, productsTable.id),
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(stockMovementsTable.movementDate), desc(stockMovementsTable.id));
  return filters.limit === undefined ? query : query.limit(filters.limit);
}

export async function createMovement(kind: MovementKind, data: MovementInput) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT id FROM ${productsTable} WHERE id = ${data.productId} FOR UPDATE`,
    );

    const [product] = await tx
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, data.productId));

    if (!product) {
      const error = new Error("Produto não encontrado.");
      error.name = "NotFoundError";
      throw error;
    }
    if (!product.active) {
      const error = new Error("Produtos inativos não podem ser movimentados.");
      error.name = "ValidationError";
      throw error;
    }

    const stockBefore = product.currentStock;
    const stockAfter =
      kind === "ENTRY"
        ? stockBefore + data.quantity
        : stockBefore - data.quantity;

    if (kind === "EXIT" && data.quantity > stockBefore) {
      const error = new Error(
        `Estoque insuficiente. Disponível: ${stockBefore} unidade(s).`,
      );
      error.name = "InsufficientStockError";
      throw error;
    }

    await tx
      .update(productsTable)
      .set({ currentStock: stockAfter })
      .where(eq(productsTable.id, product.id));

    const [movement] = await tx
      .insert(stockMovementsTable)
      .values({
        productId: product.id,
        type: kind,
        quantity: data.quantity,
        unitPrice: data.unitPrice ?? null,
        stockBefore,
        stockAfter,
        movementDate: data.movementDate,
        reason: data.reason ?? null,
        notes: data.notes ?? null,
      })
      .returning();

    return {
      ...movement,
      productName: product.name,
    };
  });
}

export async function getDashboardSummary() {
  const [products, movements] = await Promise.all([
    db.select().from(productsTable).where(eq(productsTable.active, true)),
    db.select().from(stockMovementsTable),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const movementsThisMonth = movements.filter(
    (movement) => movement.movementDate >= monthStart,
  ).length;

  return {
    activeProducts: products.length,
    totalItems: products.reduce((sum, product) => sum + product.currentStock, 0),
    lowStockProducts: products.filter(
      (product) => product.currentStock <= product.minimumStock,
    ).length,
    movementsThisMonth,
    stockValue: products.reduce(
      (sum, product) => sum + product.currentStock * (product.costPrice ?? 0),
      0,
    ),
  };
}

export async function getLowStockProducts() {
  return db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.active, true),
        sql`${productsTable.currentStock} <= ${productsTable.minimumStock}`,
      ),
    )
    .orderBy(productsTable.currentStock, productsTable.name);
}

export async function getRecentMovements(limit: number) {
  return listMovements({ limit });
}

export async function getStockReport() {
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.active, true))
    .orderBy(productsTable.name);

  return products.map((product) => ({
    productId: product.id,
    code: product.code,
    name: product.name,
    currentStock: product.currentStock,
    minimumStock: product.minimumStock,
    salePrice: product.salePrice,
    stockValue: product.currentStock * (product.costPrice ?? product.salePrice),
    status:
      product.currentStock === 0
        ? "OUT"
        : product.currentStock <= product.minimumStock
          ? "LOW"
          : "OK",
  }));
}

export async function getMovementReport(filters: { from?: Date; to?: Date }) {
  const movements = await listMovements({
    ...filters,
  });
  const entries = movements.filter((movement) => movement.type === "ENTRY");
  const exits = movements.filter((movement) => movement.type === "EXIT");
  return {
    entries: entries.length,
    exits: exits.length,
    totalEntryItems: entries.reduce((sum, movement) => sum + movement.quantity, 0),
    totalExitItems: exits.reduce((sum, movement) => sum + movement.quantity, 0),
  };
}