import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
  type QueryKey,
} from '@tanstack/react-query';
import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types — mirror the original generated schemas from api.schemas.ts
// ---------------------------------------------------------------------------

export interface Product {
  id: number;
  code: string;
  name: string;
  description: string | null;
  salePrice: number;
  costPrice: number | null;
  currentStock: number;
  minimumStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  code: string;
  name: string;
  description?: string | null;
  salePrice: number;
  costPrice?: number | null;
  initialStock?: number;
  minimumStock: number;
}

export interface ProductUpdate {
  code?: string;
  name?: string;
  description?: string | null;
  salePrice?: number;
  costPrice?: number | null;
  minimumStock?: number;
}

export interface ProductStatusInput {
  active: boolean;
}

export interface Movement {
  id: number;
  productId: number;
  productName: string;
  type: 'ENTRY' | 'EXIT';
  quantity: number;
  unitPrice: number | null;
  stockBefore: number;
  stockAfter: number;
  movementDate: string;
  reason: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MovementInput {
  productId: number;
  quantity: number;
  unitPrice?: number | null;
  movementDate: string;
  reason?: string | null;
  notes?: string | null;
}

export interface DashboardSummary {
  activeProducts: number;
  totalItems: number;
  lowStockProducts: number;
  movementsThisMonth: number;
  stockValue: number;
}

export interface StockReportItem {
  productId: number;
  code: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  salePrice: number;
  stockValue: number;
  status: 'OK' | 'LOW' | 'OUT';
}

export interface MovementReport {
  entries: number;
  exits: number;
  totalEntryItems: number;
  totalExitItems: number;
}

export interface HealthStatus {
  status: string;
}

export type ListProductsParams = {
  search?: string;
  lowStock?: boolean;
  active?: boolean;
};

export type ListMovementsParams = {
  productId?: number;
  type?: 'ENTRY' | 'EXIT';
  from?: string;
  to?: string;
  limit?: number;
};

export type GetRecentMovementsParams = {
  limit?: number;
};

export type GetMovementReportParams = {
  from?: string;
  to?: string;
};

export interface BadRequestResponse {
  error: string;
}
export interface NotFoundResponse {
  error: string;
}
export interface ConflictResponse {
  error: string;
}

export type MovementType = 'ENTRY' | 'EXIT';
export const MovementType = {
  ENTRY: 'ENTRY',
  EXIT: 'EXIT',
} as const;

export type StockReportItemStatus = 'OK' | 'LOW' | 'OUT';
export const StockReportItemStatus = {
  OK: 'OK',
  LOW: 'LOW',
  OUT: 'OUT',
} as const;

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class ApiError<T = unknown> extends Error {
  readonly status: number;
  readonly data: T | null;
  constructor(message: string, status = 500, data: T | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ---------------------------------------------------------------------------
// DB row shapes (snake_case from Supabase)
// ---------------------------------------------------------------------------

interface ProductRow {
  id: number;
  code: string;
  name: string;
  description: string | null;
  sale_price: number;
  cost_price: number | null;
  current_stock: number;
  minimum_stock: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface MovementRow {
  id: number;
  product_id: number;
  type: 'ENTRY' | 'EXIT';
  quantity: number;
  unit_price: number | null;
  stock_before: number;
  stock_after: number;
  movement_date: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    salePrice: Number(row.sale_price),
    costPrice: row.cost_price !== null ? Number(row.cost_price) : null,
    currentStock: row.current_stock,
    minimumStock: row.minimum_stock,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMovement(
  row: MovementRow & { products?: { name: string } },
): Movement {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.products?.name ?? '',
    type: row.type,
    quantity: row.quantity,
    unitPrice: row.unit_price !== null ? Number(row.unit_price) : null,
    stockBefore: row.stock_before,
    stockAfter: row.stock_after,
    movementDate: row.movement_date,
    reason: row.reason,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Data access functions
// ---------------------------------------------------------------------------

async function fetchProducts(params?: ListProductsParams): Promise<Product[]> {
  let query = supabase.from('products').select('*');

  if (params?.search) {
    const ilike = `%${params.search}%`;
    query = query.or(`name.ilike.${ilike},code.ilike.${ilike}`);
  }
  if (params?.active !== undefined) {
    query = query.eq('active', params.active);
  }

  query = query.order('name');

  const { data, error } = await query;
  if (error) throw new ApiError(error.message, 500, error);

  let rows = data as ProductRow[];
  if (params?.lowStock) {
    rows = rows.filter((p) => p.current_stock <= p.minimum_stock);
  }

  return rows.map(mapProduct);
}

async function fetchProduct(id: number): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new ApiError(error.message, 500, error);
  if (!data) throw new ApiError('Produto não encontrado.', 404);
  return mapProduct(data as ProductRow);
}

async function createProduct(input: ProductInput): Promise<Product> {
  const initialStock = input.initialStock ?? 0;

  const { data: productRow, error: insertError } = await supabase
    .from('products')
    .insert({
      code: input.code.trim(),
      name: input.name.trim(),
      description: input.description ?? null,
      sale_price: input.salePrice,
      cost_price: input.costPrice ?? null,
      current_stock: initialStock,
      minimum_stock: input.minimumStock,
    })
    .select('*')
    .single();
  if (insertError) {
    if (insertError.code === '23505') {
      throw new ApiError('Já existe um produto com este código.', 409);
    }
    throw new ApiError(insertError.message, 400, insertError);
  }

  if (initialStock > 0) {
    const { error: moveError } = await supabase
      .from('stock_movements')
      .insert({
        product_id: (productRow as ProductRow).id,
        type: 'ENTRY',
        quantity: initialStock,
        unit_price: input.costPrice ?? null,
        stock_before: 0,
        stock_after: initialStock,
        movement_date: new Date().toISOString(),
        reason: 'Estoque inicial',
        notes: 'Saldo informado no cadastro do produto',
      });
    if (moveError) throw new ApiError(moveError.message, 500, moveError);
  }

  return mapProduct(productRow as ProductRow);
}

async function updateProduct(
  id: number,
  input: ProductUpdate,
): Promise<Product> {
  const updates: Record<string, unknown> = {};
  if (input.code !== undefined) updates.code = input.code.trim();
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.description !== undefined) updates.description = input.description;
  if (input.salePrice !== undefined) updates.sale_price = input.salePrice;
  if (input.costPrice !== undefined) updates.cost_price = input.costPrice;
  if (input.minimumStock !== undefined) updates.minimum_stock = input.minimumStock;

  if (Object.keys(updates).length === 0) {
    return fetchProduct(id);
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) {
    if (error.code === '23505') {
      throw new ApiError('Já existe um produto com este código.', 409);
    }
    throw new ApiError(error.message, 400, error);
  }
  if (!data) throw new ApiError('Produto não encontrado.', 404);
  return mapProduct(data as ProductRow);
}

async function toggleProductStatus(
  id: number,
  input: ProductStatusInput,
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ active: input.active })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw new ApiError(error.message, 500, error);
  if (!data) throw new ApiError('Produto não encontrado.', 404);
  return mapProduct(data as ProductRow);
}

async function fetchMovements(
  params?: ListMovementsParams,
): Promise<Movement[]> {
  let query = supabase
    .from('stock_movements')
    .select('*, products(name)')
    .order('movement_date', { ascending: false })
    .order('id', { ascending: false });

  if (params?.productId !== undefined) {
    query = query.eq('product_id', params.productId);
  }
  if (params?.type) {
    query = query.eq('type', params.type);
  }
  if (params?.from) {
    query = query.gte('movement_date', `${params.from}T00:00:00.000Z`);
  }
  if (params?.to) {
    query = query.lte('movement_date', `${params.to}T23:59:59.999Z`);
  }
  if (params?.limit !== undefined) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;
  if (error) throw new ApiError(error.message, 500, error);
  return (data as (MovementRow & { products: { name: string } })[]).map(
    mapMovement,
  );
}

async function createMovement(
  kind: 'ENTRY' | 'EXIT',
  input: MovementInput,
): Promise<Movement> {
  const { data, error } = await supabase.rpc('create_movement', {
    p_product_id: input.productId,
    p_movement_type: kind,
    p_quantity: input.quantity,
    p_unit_price: input.unitPrice ?? null,
    p_movement_date: input.movementDate,
    p_reason: input.reason ?? null,
    p_notes: input.notes ?? null,
  });
  if (error) {
    const msg = error.message || 'Erro inesperado.';
    const status =
      msg.includes('não encontrado') ? 404 :
      msg.includes('Estoque insuficiente') ? 409 :
      400;
    throw new ApiError(msg, status, error);
  }
  return data as unknown as Movement;
}

async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('*')
    .eq('active', true);
  if (pErr) throw new ApiError(pErr.message, 500, pErr);

  const { data: movements, error: mErr } = await supabase
    .from('stock_movements')
    .select('movement_date');
  if (mErr) throw new ApiError(mErr.message, 500, mErr);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const movementsThisMonth = (movements as { movement_date: string }[]).filter(
    (m) => new Date(m.movement_date) >= monthStart,
  ).length;

  const rows = (products as ProductRow[]);
  return {
    activeProducts: rows.length,
    totalItems: rows.reduce((s, p) => s + p.current_stock, 0),
    lowStockProducts: rows.filter(
      (p) => p.current_stock <= p.minimum_stock,
    ).length,
    movementsThisMonth,
    stockValue: rows.reduce(
      (s, p) => s + p.current_stock * (p.cost_price ?? 0),
      0,
    ),
  };
}

async function fetchLowStockProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('name');
  if (error) throw new ApiError(error.message, 500, error);

  return (data as ProductRow[])
    .filter((p) => p.current_stock <= p.minimum_stock)
    .sort((a, b) => a.current_stock - b.current_stock || a.name.localeCompare(b.name))
    .map(mapProduct);
}

async function fetchRecentMovements(
  params?: GetRecentMovementsParams,
): Promise<Movement[]> {
  return fetchMovements({ limit: params?.limit ?? 10 });
}

async function fetchStockReport(): Promise<StockReportItem[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('name');
  if (error) throw new ApiError(error.message, 500, error);

  return (data as ProductRow[]).map((p) => ({
    productId: p.id,
    code: p.code,
    name: p.name,
    currentStock: p.current_stock,
    minimumStock: p.minimum_stock,
    salePrice: Number(p.sale_price),
    stockValue:
      p.current_stock * Number(p.cost_price ?? p.sale_price),
    status:
      p.current_stock === 0
        ? 'OUT'
        : p.current_stock <= p.minimum_stock
          ? 'LOW'
          : 'OK',
  }));
}

async function fetchMovementReport(
  params?: GetMovementReportParams,
): Promise<MovementReport> {
  const movements = await fetchMovements({
    from: params?.from,
    to: params?.to,
    limit: 10000,
  });
  const entries = movements.filter((m) => m.type === 'ENTRY');
  const exits = movements.filter((m) => m.type === 'EXIT');
  return {
    entries: entries.length,
    exits: exits.length,
    totalEntryItems: entries.reduce((s, m) => s + m.quantity, 0),
    totalExitItems: exits.reduce((s, m) => s + m.quantity, 0),
  };
}

// ---------------------------------------------------------------------------
// Query key helpers (must match the names used by the pages)
// ---------------------------------------------------------------------------

export const getListProductsQueryKey = (params?: ListProductsParams) =>
  ['/api/products', ...(params ? [params] : [])] as const;

export const getGetProductQueryKey = (id: number) =>
  [`/api/products/${id}`] as const;

export const getListMovementsQueryKey = (params?: ListMovementsParams) =>
  ['/api/movements', ...(params ? [params] : [])] as const;

export const getGetDashboardSummaryQueryKey = () =>
  ['/api/dashboard/summary'] as const;

export const getGetLowStockProductsQueryKey = () =>
  ['/api/dashboard/low-stock'] as const;

export const getGetRecentMovementsQueryKey = (
  params?: GetRecentMovementsParams,
) =>
  ['/api/dashboard/recent-movements', ...(params ? [params] : [])] as const;

export const getGetStockReportQueryKey = () => ['/api/reports/stock'] as const;

export const getGetMovementReportQueryKey = (
  params?: GetMovementReportParams,
) =>
  ['/api/reports/movements', ...(params ? [params] : [])] as const;

export const getHealthCheckQueryKey = () => ['/api/healthz'] as const;

// ---------------------------------------------------------------------------
// Hooks — useHealthCheck
// ---------------------------------------------------------------------------

export function useHealthCheck() {
  return useQuery({
    queryKey: getHealthCheckQueryKey(),
    queryFn: async () => ({ status: 'ok' }) as HealthStatus,
  });
}

// ---------------------------------------------------------------------------
// Hooks — Products
// ---------------------------------------------------------------------------

export function useListProducts(
  params?: ListProductsParams,
  options?: {
    query?: UseQueryOptions<Product[], ApiError>;
  },
) {
  const { query: queryOptions } = options ?? {};
  return useQuery({
    queryKey: getListProductsQueryKey(params),
    queryFn: () => fetchProducts(params),
    ...queryOptions,
  });
}

export function useGetProduct(
  id: number,
  options?: {
    query?: UseQueryOptions<Product, ApiError>;
  },
) {
  const { query: queryOptions } = options ?? {};
  return useQuery({
    queryKey: getGetProductQueryKey(id),
    queryFn: () => fetchProduct(id),
    enabled: id != null && !Number.isNaN(id),
    ...queryOptions,
  });
}

export function useCreateProduct(
  options?: {
    mutation?: UseMutationOptions<
      Product,
      ApiError<BadRequestResponse | ConflictResponse>,
      { data: ProductInput }
    >;
  },
) {
  const { mutation: mutationOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ data }) => createProduct(data),
    ...mutationOptions,
  });
}

export function useUpdateProduct(
  options?: {
    mutation?: UseMutationOptions<
      Product,
      ApiError<BadRequestResponse | NotFoundResponse | ConflictResponse>,
      { id: number; data: ProductUpdate }
    >;
  },
) {
  const { mutation: mutationOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    ...mutationOptions,
  });
}

export function useToggleProductStatus(
  options?: {
    mutation?: UseMutationOptions<
      Product,
      ApiError<NotFoundResponse>,
      { id: number; data: ProductStatusInput }
    >;
  },
) {
  const { mutation: mutationOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ id, data }) => toggleProductStatus(id, data),
    ...mutationOptions,
  });
}

// ---------------------------------------------------------------------------
// Hooks — Movements
// ---------------------------------------------------------------------------

export function useListMovements(
  params?: ListMovementsParams,
  options?: {
    query?: UseQueryOptions<Movement[], ApiError>;
  },
) {
  const { query: queryOptions } = options ?? {};
  return useQuery({
    queryKey: getListMovementsQueryKey(params),
    queryFn: () => fetchMovements(params),
    ...queryOptions,
  });
}

export function useCreateEntry(
  options?: {
    mutation?: UseMutationOptions<
      Movement,
      ApiError<BadRequestResponse | NotFoundResponse>,
      { data: MovementInput }
    >;
  },
) {
  const { mutation: mutationOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ data }) => createMovement('ENTRY', data),
    ...mutationOptions,
  });
}

export function useCreateExit(
  options?: {
    mutation?: UseMutationOptions<
      Movement,
      ApiError<BadRequestResponse | NotFoundResponse | ConflictResponse>,
      { data: MovementInput }
    >;
  },
) {
  const { mutation: mutationOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ data }) => createMovement('EXIT', data),
    ...mutationOptions,
  });
}

// ---------------------------------------------------------------------------
// Hooks — Dashboard
// ---------------------------------------------------------------------------

export function useGetDashboardSummary(
  options?: {
    query?: UseQueryOptions<DashboardSummary, ApiError>;
  },
) {
  const { query: queryOptions } = options ?? {};
  return useQuery({
    queryKey: getGetDashboardSummaryQueryKey(),
    queryFn: fetchDashboardSummary,
    ...queryOptions,
  });
}

export function useGetLowStockProducts(
  options?: {
    query?: UseQueryOptions<Product[], ApiError>;
  },
) {
  const { query: queryOptions } = options ?? {};
  return useQuery({
    queryKey: getGetLowStockProductsQueryKey(),
    queryFn: fetchLowStockProducts,
    ...queryOptions,
  });
}

export function useGetRecentMovements(
  params?: GetRecentMovementsParams,
  options?: {
    query?: UseQueryOptions<Movement[], ApiError>;
  },
) {
  const { query: queryOptions } = options ?? {};
  return useQuery({
    queryKey: getGetRecentMovementsQueryKey(params),
    queryFn: () => fetchRecentMovements(params),
    ...queryOptions,
  });
}

// ---------------------------------------------------------------------------
// Hooks — Reports
// ---------------------------------------------------------------------------

export function useGetStockReport(
  options?: {
    query?: UseQueryOptions<StockReportItem[], ApiError>;
  },
) {
  const { query: queryOptions } = options ?? {};
  return useQuery({
    queryKey: getGetStockReportQueryKey(),
    queryFn: fetchStockReport,
    ...queryOptions,
  });
}

export function useGetMovementReport(
  params?: GetMovementReportParams,
  options?: {
    query?: UseQueryOptions<MovementReport, ApiError>;
  },
) {
  const { query: queryOptions } = options ?? {};
  return useQuery({
    queryKey: getGetMovementReportQueryKey(params),
    queryFn: () => fetchMovementReport(params),
    ...queryOptions,
  });
}

// ---------------------------------------------------------------------------
// Exports for backwards compatibility with custom-fetch re-exports
// ---------------------------------------------------------------------------

export type AuthTokenGetter = () => Promise<string | null> | string | null;
export function setBaseUrl(_url: string | null): void {}
export function setAuthTokenGetter(_getter: AuthTokenGetter | null): void {}

export type { QueryKey };
