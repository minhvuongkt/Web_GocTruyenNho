import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  Tag, 
  Layout,
  CreditCard,
  LogOut,
  Menu,
  X,
  ChevronDown,
  BookMarked,
  Users2,
  LibraryBig
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Không có quyền truy cập</h1>
          <p className="text-muted-foreground mb-4">Bạn không có quyền truy cập vào trang quản trị.</p>
          <Button asChild>
            <Link href="/">Quay lại trang chủ</Link>
          </Button>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Quản lý truyện", href: "/admin/manga", icon: BookOpen },
    { name: "Quản lý thể loại", href: "/admin/genres", icon: Tag },
    { name: "Quản lý tác giả", href: "/admin/authors", icon: Users2 },
    { name: "Quản lý nhóm dịch", href: "/admin/translation-groups", icon: LibraryBig },
    { name: "Quản lý người dùng", href: "/admin/users", icon: Users },
    { name: "Quản lý thanh toán", href: "/admin/payments", icon: CreditCard },
    { name: "Quản lý quảng cáo", href: "/admin/ads", icon: Layout },
  ];

  const Sidebar = () => (
    <aside className="bg-white dark:bg-slate-900 border-r border-border p-4 w-64 h-full">
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <Link href="/admin" className="flex items-center space-x-2">
            <span className="text-primary font-bold text-xl">GocTruyenNho</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Trang quản trị</p>
        </div>
        
        <nav className="space-y-1 flex-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between px-3 py-2 text-sm">
            <div>
              <p className="font-medium">{user.username}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          
          <div className="mt-2 space-y-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </Button>
            
            <Button asChild variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
              <Link href="/">
                <ChevronDown className="mr-2 h-4 w-4 rotate-90" />
                Quay lại trang chủ
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden bg-white dark:bg-slate-900 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center space-x-2">
              <span className="text-primary font-bold text-xl">GocTruyenNho</span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
