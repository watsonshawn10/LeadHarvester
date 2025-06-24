import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import Home from "@/pages/home";
import HomeownerDashboard from "@/pages/homeowner-dashboard";
import BusinessDashboard from "@/pages/business-dashboard";
import Auth from "@/pages/auth";
import ProjectDetails from "@/pages/project-details";
import LeadMarketplace from "@/pages/lead-marketplace";
import ContractorSettings from "@/pages/contractor-settings";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/homeowner-dashboard" component={HomeownerDashboard} />
      <Route path="/business-dashboard" component={BusinessDashboard} />
      <Route path="/lead-marketplace" component={LeadMarketplace} />
      <Route path="/contractor-settings" component={ContractorSettings} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/project/:id" component={ProjectDetails} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
