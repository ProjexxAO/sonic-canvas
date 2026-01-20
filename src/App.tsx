import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { WorkspacesProvider } from "@/hooks/useWorkspaces";
import { useVoiceCommandExecutor } from "@/hooks/useVoiceCommandExecutor";
import { AtlasProvider } from "@/contexts/AtlasContext";
import { GlobalAtlasOrb } from "@/components/atlas/GlobalAtlasOrb";
import { GlobalAccessibilityHandler } from "@/components/personalization/GlobalAccessibilityHandler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Atlas from "./pages/Atlas";
import ImportAgents from "./pages/ImportAgents";
import UserToolPermissions from "./pages/UserToolPermissions";
import ToolGovernance from "./pages/ToolGovernance";
import Integrations from "./pages/Integrations";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

// Component that uses the voice command executor hook
function VoiceCommandHandler() {
  useVoiceCommandExecutor();
  return null;
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="sonic-theme"
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WorkspacesProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AtlasProvider>
                  <VoiceCommandHandler />
                  <GlobalAccessibilityHandler />
                  <ErrorBoundary>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/atlas" element={<Atlas />} />
                      <Route path="/import" element={<ImportAgents />} />
                      <Route path="/workspace/tools/:userId?" element={<UserToolPermissions />} />
                      <Route path="/governance" element={<ToolGovernance />} />
                      <Route path="/marketplace" element={<Integrations />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </ErrorBoundary>
                  <GlobalAtlasOrb />
                </AtlasProvider>
              </BrowserRouter>
            </TooltipProvider>
          </WorkspacesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
