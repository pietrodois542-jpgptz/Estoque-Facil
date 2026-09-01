import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import ProductForm from "@/pages/product-form";
import MovementForm from "@/pages/movement-form";
import Movements from "@/pages/movements";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();
function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function Router() { return <AppShell><RoutedErrorBoundary><Switch><Route path="/" component={Dashboard} /><Route path="/produtos" component={Products} /><Route path="/produtos/novo" component={ProductForm} /><Route path="/produtos/:id/editar" component={ProductForm} /><Route path="/entrada"><MovementForm type="ENTRY" /></Route><Route path="/saida"><MovementForm type="EXIT" /></Route><Route path="/movimentacoes" component={Movements} /><Route path="/relatorios" component={Reports} /><Route component={NotFound} /></Switch></RoutedErrorBoundary></AppShell>; }
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;
