import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  getGetDashboardSummaryQueryKey,
  getGetLowStockProductsQueryKey,
  getGetRecentMovementsQueryKey,
  getListMovementsQueryKey,
  getListProductsQueryKey,
  useCreateEntry,
  useCreateExit,
  useListProducts,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Saving,
  Select,
  SelectChevron,
  Textarea,
} from "@/components/ui";

export default function MovementForm({ type }: { type: "ENTRY" | "EXIT" }) {
  const entry = type === "ENTRY";
  const [, setLocation] = useLocation();
  const products = useListProducts({ active: true });
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    unitPrice: "",
    movementDate: new Date().toISOString().slice(0, 10),
    reason: "",
    notes: "",
  });
  const [done, setDone] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [exitConfirmed, setExitConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createEntry = useCreateEntry();
  const createExit = useCreateExit();
  const mutation = entry ? createEntry : createExit;
  const mutationError =
    mutation.error instanceof Error
      ? mutation.error.message.replace(/^HTTP \d+ [^:]+:\s*/, "")
      : null;

  const set = (
    key: keyof typeof form,
  ) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const quantity = Number(form.quantity);
    const unitPrice = form.unitPrice ? Number(form.unitPrice) : null;
    const next: Record<string, string> = {};
    if (!form.productId) next.productId = "Selecione um produto.";
    if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 1) {
      next.quantity = "Informe um número inteiro maior que zero.";
    }
    if (unitPrice !== null && (!Number.isFinite(unitPrice) || unitPrice < 0)) {
      next.unitPrice = "Informe um preço válido.";
    }
    if (!form.movementDate) next.movementDate = "Informe a data.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (!entry && !exitConfirmed) {
      setConfirmExit(true);
      return;
    }

    setConfirmExit(false);
    setExitConfirmed(false);
    mutation.mutate(
      {
        data: {
          productId: Number(form.productId),
          quantity,
          unitPrice,
          movementDate: form.movementDate,
          reason: form.reason.trim() || null,
          notes: form.notes.trim() || null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListMovementsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLowStockProductsQueryKey() });
          queryClient.invalidateQueries({
            queryKey: getGetRecentMovementsQueryKey({ limit: 6 }),
          });
          setDone(true);
        },
      },
    );
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl animate-rise-in py-12 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-[-.04em]">
          {entry ? "Entrada registrada" : "Saída registrada"}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          {entry ? "A entrada foi concluída e o saldo do produto já foi atualizado." : "A saída foi concluída e o novo saldo já está disponível no histórico."}
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Button
            onClick={() => {
              setDone(false);
              setForm((current) => ({ ...current, quantity: "", notes: "" }));
            }}
            data-testid="button-new-movement"
            className="bg-primary text-primary-foreground"
          >
            Registrar outro
          </Button>
          <Link
            href="/"
            data-testid="link-after-movement-dashboard"
            className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-bold"
          >
            Ir para visão geral
          </Link>
        </div>
      </div>
    );
  }

  const selectedProduct = products.data?.find((product) => product.id === Number(form.productId));

  return (
    <div className="mx-auto max-w-3xl animate-rise-in">
      {confirmExit && !entry && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-exit-title">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><ArrowUpFromLine size={22} /></div>
            <h2 id="confirm-exit-title" className="mt-4 text-center text-xl font-extrabold">Confirmar saída</h2>
            <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">Você deseja registrar a saída de <strong className="text-foreground">{Number(form.quantity)} unidade{Number(form.quantity) === 1 ? "" : "s"}</strong>{selectedProduct ? <> de <strong className="text-foreground">{selectedProduct.name}</strong></> : null}?</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" onClick={() => setConfirmExit(false)} className="bg-secondary text-secondary-foreground">Cancelar</Button>
              <Button type="button" onClick={() => { setConfirmExit(false); setExitConfirmed(true); setTimeout(() => document.querySelector<HTMLFormElement>('form[data-movement-form="true"]')?.requestSubmit(), 0); }} className="bg-foreground text-background"><ArrowUpFromLine size={16}/>Confirmar saída</Button>
            </div>
          </div>
        </div>
      )}
      <Link
        href="/"
        data-testid="link-back-movement"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={16} /> Voltar para visão geral
      </Link>
      <PageHeader
        eyebrow={entry ? "Operação / entrada" : "Operação / saída"}
        title={entry ? "Registrar entrada" : "Registrar saída"}
        description={
          entry
            ? "Adicione unidades recebidas ao saldo de um produto."
            : "Registre uma venda, perda ou retirada do estoque."
        }
      />
      {products.isError ? (
        <EmptyState
          title="Não foi possível carregar produtos"
          detail="Tente novamente em alguns instantes."
        />
      ) : !products.isLoading && !products.data?.length ? (
        <EmptyState
          title="Nenhum produto ativo"
          detail="Cadastre ou ative um produto antes de registrar movimentos."
        />
      ) : (
        <form
          onSubmit={submit}
          data-movement-form="true"
          className="overflow-hidden rounded-xl border border-card-border bg-card shadow-sm"
        >
          {mutationError && (
            <div
              role="alert"
              className="border-b border-destructive/20 bg-destructive/5 px-5 py-4 text-sm font-semibold text-destructive sm:px-7"
            >
              {mutationError}
            </div>
          )}
          <div
            className={`border-b px-5 py-5 sm:px-7 ${
              entry ? "border-primary/15 bg-primary/5" : "border-accent/20 bg-accent/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                  entry ? "bg-primary/15 text-primary" : "bg-accent/25 text-foreground"
                }`}
              >
                {entry ? <ArrowDownToLine size={20} /> : <ArrowUpFromLine size={20} />}
              </span>
              <div>
                <div className="text-sm font-extrabold">
                  {entry ? "Entrada de mercadoria" : "Saída de mercadoria"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {entry
                    ? "O estoque será somado ao saldo atual."
                    : "O estoque será subtraído do saldo atual."}
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
            <div className="relative sm:col-span-2">
              <Field label="Produto" required error={errors.productId}>
                <Select
                  value={form.productId}
                  onChange={set("productId")}
                  disabled={products.isLoading}
                  data-testid="select-movement-product"
                >
                  <option value="">
                    {products.isLoading
                      ? "Carregando produtos..."
                      : "Selecione um produto ativo"}
                  </option>
                  {products.data?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} · {product.code} · {product.currentStock} un.
                    </option>
                  ))}
                </Select>
                <SelectChevron />
              </Field>
            </div>
            <Field label="Quantidade" required error={errors.quantity}>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={set("quantity")}
                placeholder="0"
                data-testid="input-movement-quantity"
              />
            </Field>
            <Field label="Preço unitário" hint="Opcional · em reais" error={errors.unitPrice}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={set("unitPrice")}
                placeholder="0,00"
                data-testid="input-movement-unit-price"
              />
            </Field>
            <Field label="Data do movimento" required error={errors.movementDate}>
              <div className="relative">
                <CalendarDays
                  className="pointer-events-none absolute left-3 top-3 text-muted-foreground"
                  size={16}
                />
                <Input
                  type="date"
                  value={form.movementDate}
                  onChange={set("movementDate")}
                  className="pl-10"
                  data-testid="input-movement-date"
                />
              </div>
            </Field>
            <Field label="Motivo" hint="Opcional">
              <Input
                value={form.reason}
                onChange={set("reason")}
                maxLength={100}
                placeholder={entry ? "Ex.: compra do fornecedor" : "Ex.: venda no balcão"}
                data-testid="input-movement-reason"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Observações" hint="Até 500 caracteres">
                <Textarea
                  value={form.notes}
                  onChange={set("notes")}
                  maxLength={500}
                  placeholder="Algum detalhe importante sobre este movimento?"
                  data-testid="input-movement-notes"
                />
              </Field>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <Link
              href="/"
              data-testid="link-cancel-movement"
              className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-secondary"
            >
              Cancelar
            </Link>
            <Button
              type="submit"
              disabled={mutation.isPending}
              data-testid="button-save-movement"
              className={entry ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}
            >
              {mutation.isPending ? (
                <Saving label="Registrando..." />
              ) : (
                <>
                  {entry ? <ArrowDownToLine size={16} /> : <ArrowUpFromLine size={16} />}
                  Registrar {entry ? "entrada" : "saída"}
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}