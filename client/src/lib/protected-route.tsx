import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

export function ProtectedRoute({
  path,
  component: Component,
  children,
  requireAdmin = false
}: {
  path: string;
  component?: () => React.JSX.Element;
  children?: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, isLoading } = useAuth();

  // Check if user is admin when required
  const { data: adminData, isLoading: isAdminCheckLoading } = useQuery({
    queryKey: ["/api/user/is-admin"],
    enabled: !!user && requireAdmin, // Only run this query if user exists and admin is required
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/is-admin");
      return res.json();
    }
  });

  if (isLoading || (requireAdmin && isAdminCheckLoading)) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Đang tải...</span>
        </div>
      </Route>
    );
  }

  // If not logged in, redirect to auth page
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If admin access is required but user is not admin, redirect to home
  if (requireAdmin && adminData && !adminData.isAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // User is authenticated (and is admin if required)
  return (
    <Route path={path}>
      {Component ? <Component /> : children}
    </Route>
  );
}
