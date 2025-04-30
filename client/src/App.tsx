import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/ui/theme-provider";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { normalizeId } from "@/lib/hashUtils";

// Pages
import HomePage from "@/pages/home-page";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import MangaDetailPage from "@/pages/manga-detail-page";
import NovelDetailPage from "@/pages/novel-detail-page";
import MangaReaderPage from "@/pages/manga-reader-page";
import NovelReaderPage from "@/pages/novel-reader-page";
import ContentDetailPage from "@/pages/content-detail-page";
import ChapterReaderPage from "@/pages/chapter-reader-page";
import ProfilePage from "@/pages/profile-page";
import PaymentPage from "@/pages/payment-page";
import SearchPage from "@/pages/search-page";
import { PaymentTestPage } from "@/pages/payment-test-page";
import PaymentCallbackPage from "@/pages/payment-callback";
import Redirect from "@/components/shared/redirect";

// Admin Pages
import DashboardPage from "@/pages/admin/dashboard-page";
import MangaManagementPage from "@/pages/admin/manga-management-page";
import UsersManagementPage from "@/pages/admin/users-management-page";
import PaymentManagementPage from "@/pages/admin/payment-management-page";
import PaymentSettingsPage from "@/pages/admin/payment-settings-page";
import AdManagementPage from "@/pages/admin/ad-management-page";
import GenreManagementPage from "@/pages/admin/genre-management-page";
import AuthorManagementPage from "@/pages/admin/author-management-page";
import TranslationGroupManagementPage from "@/pages/admin/translation-group-management-page";

// Admin Chapter Pages
import ChapterListPage from "./pages/admin/chapters/chapter-list-page";
import ChapterNewPage from "./pages/admin/chapters/chapter-new-page";
import ChapterEditPage from "./pages/admin/chapters/chapter-edit-page";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/search" component={SearchPage} />
      
      {/* Content detail pages */}
      <Route path="/truyen/:id">
        {(params) => {
          const id = normalizeId(params.id);
          // We'll fetch the content type and render the appropriate component
          return <ContentDetailPage id={id} />;
        }}
      </Route>
      
      {/* Legacy routes for compatibility */}
      <Route path="/manga/:id">
        {(params) => <Redirect to={`/truyen/${params.id}`} />}
      </Route>
      <Route path="/novel/:id">
        {(params) => <Redirect to={`/truyen/${params.id}`} />}
      </Route>
      
      {/* Reader pages - new format according to requirements using title and chapter number */}
      <Route path="/truyen/:contentTitle/chapter/:chapterNumber">
        {(params) => (
          <ChapterReaderPage 
            contentTitle={params.contentTitle} 
            chapterNumber={parseInt(params.chapterNumber)}
            usingTitle={true}
          />
        )}
      </Route>
      
      {/* Legacy routes for backward compatibility */}
      <Route path="/truyen/:contentId/chapter-:chapterNumber">
        {(params) => (
          <ChapterReaderPage 
            contentId={normalizeId(params.contentId)} 
            chapterNumber={parseInt(params.chapterNumber)}
            usingChapterNumber={true}
          />
        )}
      </Route>
      
      <Route path="/truyen/:contentId/chapter/:chapterId">
        {(params) => (
          <ChapterReaderPage 
            contentId={normalizeId(params.contentId)} 
            chapterId={normalizeId(params.chapterId)} 
          />
        )}
      </Route>
      
      {/* Legacy reader routes for compatibility */}
      <Route path="/manga/:contentId/chapter/:chapterId">
        {(params) => <Redirect to={`/truyen/${params.contentId}/chapter/${params.chapterId}`} />}
      </Route>
      <Route path="/novel/:contentId/chapter/:chapterId">
        {(params) => <Redirect to={`/truyen/${params.contentId}/chapter/${params.chapterId}`} />}
      </Route>
      
      {/* Protected user routes */}
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/payment" component={PaymentPage} />
      
      {/* Payment related pages */}
      <Route path="/payment-test" component={PaymentTestPage} />
      <Route path="/payment-callback" component={PaymentCallbackPage} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin" component={DashboardPage} requireAdmin={true} />
      <ProtectedRoute path="/admin/manga" component={MangaManagementPage} requireAdmin={true} />
      <ProtectedRoute path="/admin/users" component={UsersManagementPage} requireAdmin={true} />
      {/* Admin Chapter Routes */}
      <ProtectedRoute path="/admin/chapters/:contentId" requireAdmin={true}>
        {(params) => <ChapterListPage contentId={normalizeId(params.contentId)} />}
      </ProtectedRoute>
      <ProtectedRoute path="/admin/chapters/:contentId/new" requireAdmin={true}>
        {(params) => <ChapterNewPage contentId={normalizeId(params.contentId)} />}
      </ProtectedRoute>
      <ProtectedRoute path="/admin/chapters/:contentId/chapter/:chapterId" requireAdmin={true}>
        {(params) => (
          <ChapterEditPage 
            contentId={normalizeId(params.contentId)} 
            chapterId={normalizeId(params.chapterId)} 
          />
        )}
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
