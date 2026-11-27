import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthGate } from "./components/Auth";
import Layout from "./components/Layout";
import "./index.css";
import Dashboard from "./pages/Dashboard";
import Docs from "./pages/Docs";
import Ideas from "./pages/Ideas";
import Longform from "./pages/Longform";
import Plan from "./pages/Plan";
import Profiles from "./pages/Profiles";
import ReelDetail from "./pages/ReelDetail";
import Reels from "./pages/Reels";
import SettingsPage from "./pages/Settings";
import Timeline from "./pages/Timeline";
import World from "./pages/World";
import Stats from "./pages/Stats";
import Timing from "./pages/Timing";
import { WorkPage } from "./components/WorkBar";
import { About, Privacy, Terms } from "./pages/Legal";
import { CHANNEL } from "./lib/channel";

document.title = CHANNEL.app_title;   // the browser tab shows this channel's studio name (channel.json)

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 } } });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* public pages (needed by Google and Meta app review) */}
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<AuthGate><Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="timeline" element={<Timeline />} />
              <Route path="stats" element={<Stats />} />
              <Route path="best-time" element={<Timing />} />
              <Route path="reels" element={<Reels />} />
              <Route path="reels/:code" element={<ReelDetail />} />
              <Route path="plan" element={<Plan />} />
              <Route path="longform" element={<Longform />} />
              <Route path="longform/:code" element={<Longform />} />
              <Route path="world" element={<World />} />
              <Route path="ideas" element={<Ideas />} />
              <Route path="profiles" element={<Profiles />} />
              <Route path="docs" element={<Docs />} />
              <Route path="docs/:slug" element={<Docs />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="live" element={<WorkPage />} />
              <Route path="work" element={<Navigate to="/live" replace />} />
              <Route path="*" element={<div className="py-20 text-center">Page not found.</div>} />
            </Route>
          </Routes></AuthGate>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
