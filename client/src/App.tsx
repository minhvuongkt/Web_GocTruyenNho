import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/ui/theme-provider";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

// Pages
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import MangaDetailPage from "@/pages/manga-detail-page";
import NovelDetailPage from "@/pages/novel-detail-page";
import MangaReaderPage from "@/pages/manga-reader-page";
import NovelReaderPage from "@/pages/novel-reader-page";
import ProfilePage from "@/pages/profile-page";
import PaymentPage from "@/pages/payment-page";

// Admin Pages
import DashboardPage from "@/pages/admin/dashboard-page";
import MangaManagementPage from "@/pages/admin/manga-management-page";
import UsersManagementPage from "@/pages/admin/users-management-page";
import ChapterManagementPage from "@/pages/admin/chapter-management-page";
import PaymentManagementPage from "@/pages/admin/payment-management-page";
import PaymentSettingsPage from "@/pages/admin/payment-settings-page";
import AdManagementPage from "@/pages/admin/ad-management-page";
import GenreManagementPage from "@/pages/admin/genre-management-page";
import AuthorManagementPage from "@/pages/admin/author-management-page";
import TranslationGroupManagementPage from "@/pages/admin/translation-group-management-page";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Content detail pages */}
      <Route path="/manga/:id">
        {(params) => <MangaDetailPage id={parseInt(params.id)} />}
      </Route>
      <Route path="/novel/:id">
        {(params) => <NovelDetailPage id={parseInt(params.id)} />}
      </Route>
      
      {/* Reader pages */}
      <Route path="/manga/:contentId/chapter/:chapterId">
        {(params) => (
          <MangaReaderPage 
            contentId={parseInt(params.contentId)} 
            chapterId={parseInt(params.chapterId)} 
          />
        )}
      </Route>
      <Route path="/novel/:contentId/chapter/:chapterId">
        {(params) => (
          <NovelReaderPage 
            contentId={parseInt(params.contentId)} 
            chapterId={parseInt(params.chapterId)} 
          />
        )}
      </Route>
      
      {/* Protected user routes */}
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/payment" component={PaymentPage} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin" component={DashboardPage} requireAdmin={true} />
      <ProtectedRoute path="/admin/manga" component={MangaManagementPage} requireAdmin={true} />
      <ProtectedRoute path="/admin/users" component={UsersManagementPage} requireAdmin={true} />
      <ProtectedRoute path="/admin/chapters/:contentId" requireAdmin={true}>
        {(params) => <ChapterManagementPage contentId={parseInt(params.contentId)} />}
      </ProtectedRoute>
      <ProtectedRoute path="/admin/payments" component={PaymentManagementPage} requireAdmin={true} />
      <ProtectedRoute path="/admin/payment-settings" component={PaymentSettingsPage} requireAdmin={true} />
      <ProtectedRoute path="/admin/ads" component={AdManagementPage} requireAdmin={true} />
      <ProtectedRoute path="/admin/genres" component={GenreManagementPage} requireAdmin={true} />
      <ProtectedRoute path="/admin/authors" component={AuthorManagementPage} requireAdmin={true} />
      <ProtectedRoute path="/admin/translation-groups" component={TranslationGroupManagementPage} requireAdmin={true} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="goctruyennho-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
