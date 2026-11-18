import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthGate } from "./components/Auth";
import Layout from "./components/Layout";
import "./index.css";
import Dashboard from "./pages/Dashboard";
import Docs from "./pages/Docs";
import Plan from "./pages/Plan";
import ReelDetail from "./pages/ReelDetail";
import Reels from "./pages/Reels";
import SettingsPage from "./pages/Settings";
import World from "./pages/World";

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 } } });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthGate>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="reels" element={<Reels />} />
              <Route path="reels/:code" element={<ReelDetail />} />
              <Route path="plan" element={<Plan />} />
              <Route path="world" element={<World />} />
              <Route path="docs" element={<Docs />} />
              <Route path="docs/:slug" element={<Docs />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<div className="py-20 text-center">Page not found.</div>} />
            </Route>
          </Routes>
        </AuthGate>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
