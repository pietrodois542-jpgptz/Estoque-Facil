import { Router, type IRouter } from "express";
import {
  CreateEntryBody,
  CreateEntryResponse,
  CreateExitBody,
  CreateExitResponse,
  CreateProductBody,
  CreateProductResponse,
  GetDashboardSummaryResponse,
  GetLowStockProductsResponse,
  GetMovementReportQueryParams,
  GetMovementReportResponse,
  GetProductParams,
  GetProductResponse,
  GetRecentMovementsQueryParams,
  GetRecentMovementsResponse,
  GetStockReportResponse,
  ListMovementsQueryParams,
  ListMovementsResponse,
  ListProductsQueryParams,
  ListProductsResponse,
  ToggleProductStatusBody,
  ToggleProductStatusParams,
  ToggleProductStatusResponse,
  UpdateProductBody,
  UpdateProductParams,
  UpdateProductResponse,
} from "@workspace/api-zod";
import {
  createMovement,
  createProduct,
  getDashboardSummary,
  getLowStockProducts,
  getMovementReport,
  getProduct,
  getRecentMovements,
  getStockReport,
  listMovements,
  listProducts,
  toggleProductStatus,
  updateProduct,
} from "../lib/inventory";

const router: IRouter = Router();

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro inesperado.";
}

function parseDateQuery(value: unknown) {
  if (typeof value !== "string" || !value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseMovementQuery(query: Record<string, unknown>) {
  return {
    ...query,
    from: parseDateQuery(query.from),
    to: (() => {
      const date = parseDateQuery(query.to);
      if (date) date.setUTCHours(23, 59, 59, 999);
      return date;
    })(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const products = await listProducts(parsed.data);
  res.json(ListProductsResponse.parse(products));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const product = await createProduct(parsed.data);
    res.status(201).json(CreateProductResponse.parse(product));
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      res.status(409).json({ error: "Já existe um produto com este código." });
      return;
    }
    throw error;
  }
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const product = await getProduct(params.data.id);
  if (!product) {
    res.status(404).json({ error: "Produto não encontrado." });
    return;
  }
  res.json(GetProductResponse.parse(product));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  const body = UpdateProductBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const product = await updateProduct(params.data.id, body.data);
    if (!product) {
      res.status(404).json({ error: "Produto não encontrado." });
      return;
    }
    res.json(UpdateProductResponse.parse(product));
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      res.status(409).json({ error: "Já existe um produto com este código." });
      return;
    }
    throw error;
  }
});

router.patch("/products/:id/status", async (req, res): Promise<void> => {
  const params = ToggleProductStatusParams.safeParse(req.params);
  const body = ToggleProductStatusBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const product = await toggleProductStatus(params.data.id, body.data.active);
  if (!product) {
    res.status(404).json({ error: "Produto não encontrado." });
    return;
  }
  res.json(ToggleProductStatusResponse.parse(product));
});

router.get("/movements", async (req, res): Promise<void> => {
  const parsed = ListMovementsQueryParams.safeParse(
    parseMovementQuery(req.query as Record<string, unknown>),
  );
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const movements = await listMovements(parsed.data);
  res.json(ListMovementsResponse.parse(movements));
});

router.post("/movements/entry", async (req, res): Promise<void> => {
  const parsed = CreateEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const movement = await createMovement("ENTRY", parsed.data);
    res.status(201).json(CreateEntryResponse.parse(movement));
  } catch (error) {
    const status =
      error instanceof Error && error.name === "NotFoundError" ? 404 : 400;
    res.status(status).json({ error: errorMessage(error) });
  }
});

router.post("/movements/exit", async (req, res): Promise<void> => {
  const parsed = CreateExitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const movement = await createMovement("EXIT", parsed.data);
    res.status(201).json(CreateExitResponse.parse(movement));
  } catch (error) {
    const status =
      error instanceof Error && error.name === "NotFoundError" ? 404 : 409;
    res.status(status).json({ error: errorMessage(error) });
  }
});

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const summary = await getDashboardSummary();
  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/low-stock", async (_req, res): Promise<void> => {
  const products = await getLowStockProducts();
  res.json(GetLowStockProductsResponse.parse(products));
});

router.get("/dashboard/recent-movements", async (req, res): Promise<void> => {
  const parsed = GetRecentMovementsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const movements = await getRecentMovements(parsed.data.limit);
  res.json(GetRecentMovementsResponse.parse(movements));
});

router.get("/reports/stock", async (_req, res): Promise<void> => {
  const report = await getStockReport();
  res.json(GetStockReportResponse.parse(report));
});

router.get("/reports/movements", async (req, res): Promise<void> => {
  const parsed = GetMovementReportQueryParams.safeParse(
    parseMovementQuery(req.query as Record<string, unknown>),
  );
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const report = await getMovementReport(parsed.data);
  res.json(GetMovementReportResponse.parse(report));
});

export default router;