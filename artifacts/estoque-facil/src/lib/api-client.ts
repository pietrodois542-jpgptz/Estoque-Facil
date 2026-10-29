import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
  type QueryKey,
} from '@tanstack/react-query';

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

// API HTTP da PROJETECH: utiliza o servidor Express e PostgreSQL do Replit.
// Em ambientes com front e API separados, configure VITE_API_BASE_URL.
// Nunca exponha DATABASE_URL no navegador.
const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request<T>(route: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBase}/api${route}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch {
    throw new ApiError('Não foi possível conectar à API. Verifique se o servidor está ativo.', 503);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(body?.error || `Erro HTTP ${response.status}`, response.status, body);
  }
  return body as T;
}

function queryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') q.set(key, String(value));
  });
  return q.size ? `?${q.toString()}` : '';
}

const json = (data: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(data) });
const patch = (data: unknown): RequestInit => ({ method: 'PATCH', body: JSON.stringify(data) });

async function fetchProducts(params?: ListProductsParams): Promise<Product[]> {
  return request<Product[]>(`/products${queryString(params)}`);
}
async function fetchProduct(id: number): Promise<Product> {
  return request<Product>(`/products/${id}`);
}
async function createProduct(input: ProductInput): Promise<Product> {
  return request<Product>('/products', json(input));
}
async function updateProduct(id: number, input: ProductUpdate): Promise<Product> {
  return request<Product>(`/products/${id}`, patch(input));
}
async function toggleProductStatus(id: number, input: ProductStatusInput): Promise<Product> {
  return request<Product>(`/products/${id}/status`, patch(input));
}
async function fetchMovements(params?: ListMovementsParams): Promise<Movement[]> {
  return request<Movement[]>(`/movements${queryString(params)}`);
}
async function createMovement(kind: 'ENTRY' | 'EXIT', input: MovementInput): Promise<Movement> {
  return request<Movement>(`/movements/${kind === 'ENTRY' ? 'entry' : 'exit'}`, json(input));
}
async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return request<DashboardSummary>('/dashboard/summary');
}
async function fetchLowStockProducts(): Promise<Product[]> {
  return request<Product[]>('/dashboard/low-stock');
}
async function fetchRecentMovements(params?: GetRecentMovementsParams): Promise<Movement[]> {
  return request<Movement[]>(`/dashboard/recent-movements${queryString(params)}`);
}
async function fetchStockReport(): Promise<StockReportItem[]> {
  return request<StockReportItem[]>('/reports/stock');
}
async function fetchMovementReport(params?: GetMovementReportParams): Promise<MovementReport> {
  return request<MovementReport>(`/reports/movements${queryString(params)}`);
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
