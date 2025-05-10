import React from 'react';
import { Route, Switch } from 'wouter';

// Providers
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';

// Ads Provider
import { AdsProvider } from '@/components/ads/ads-provider';

// Layouts
import { MainLayout } from '@/components/layouts/main-layout';

// Pages
import HomePage from '@/pages/home-page';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="goctruyennho-theme">
        <AuthProvider>
          <AdsProvider>
            <MainLayout>
              <Switch>
                <Route path="/" component={HomePage} />
                <Route path="/:rest*" component={() => <div>404 Not Found</div>} />
              </Switch>
            </MainLayout>
            <Toaster />
          </AdsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;