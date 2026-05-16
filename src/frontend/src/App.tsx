import { Toaster } from "@/components/ui/sonner";
import { WizardProvider } from "@/context/WizardContext";
import { AuthPage } from "@/pages/AuthPage";
import { DonePage } from "@/pages/DonePage";
import { ExecutePage } from "@/pages/ExecutePage";
import { PreviewPage } from "@/pages/PreviewPage";
import { ScanPage } from "@/pages/ScanPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30 } },
});

function RootLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: AuthPage,
});

const scanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scan",
  component: ScanPage,
});

const previewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/preview",
  component: PreviewPage,
});

const executeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/execute",
  component: ExecutePage,
});

const doneRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/done",
  component: DonePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  scanRoute,
  previewRoute,
  executeRoute,
  doneRoute,
]);

const hashHistory = createHashHistory();

const router = createRouter({ routeTree, history: hashHistory });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WizardProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </WizardProvider>
    </QueryClientProvider>
  );
}
