import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Rankings from "./pages/Rankings";
import Watchlist from "./pages/Watchlist";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { Layout } from "@/components/layout/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth and Trading routes are disabled - redirect to home */}
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="/trading" element={<Navigate to="/" replace />} />
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/market" element={<Layout><Market /></Layout>} />
          <Route path="/rankings" element={<Layout><Rankings /></Layout>} />
          <Route path="/watchlist" element={<Layout><Watchlist /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
