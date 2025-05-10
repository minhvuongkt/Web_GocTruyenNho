import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ToggleTheme } from "@/components/ui/toggle-theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  HomeIcon, 
  BookOpenIcon,
  SearchIcon, 
  UserIcon, 
  LogOutIcon, 
  MenuIcon, 
  ChevronDownIcon,
  Settings,
  Heart,
  History,
  CreditCard,
  BanIcon
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { SearchModal } from "@/components/shared/search-modal";
import { formatCurrency } from "@/lib/utils";
import { useAds } from "@/components/ads/ads-provider";
import { BannerAd } from "@/components/ads/banner-ad";
import { PopupAd } from "@/components/ads/popup-ad";
import { OverlayAd } from "@/components/ads/overlay-ad";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { showAds, showBanners, toggleAds } = useAds();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Kiểm tra xem đang ở trang đọc truyện hay không để ẩn quảng cáo
  const isReadingPage = location.includes('/read/') || location.includes('/chapter/') || location.includes('/view/');
  const { hideAdsOnReading } = useAds();
  const shouldShowAdsOnPage = !(isReadingPage && hideAdsOnReading);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Banner Ad */}
      {shouldShowAdsOnPage && (
        <div className="w-full">
          <BannerAd position="top" />
        </div>
      )}
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-primary font-bold text-2xl">GocTruyenNho</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className={`${location === '/' ? 'text-primary' : 'text-foreground/70 hover:text-primary'} font-medium transition-colors`}>
                Trang chủ
              </Link>
              <Link href="/?type=manga" className={`${location === '/?type=manga' ? 'text-primary' : 'text-foreground/70 hover:text-primary'} font-medium transition-colors`}>
                Truyện tranh
              </Link>
              <Link href="/?type=novel" className={`${location === '/?type=novel' ? 'text-primary' : 'text-foreground/70 hover:text-primary'} font-medium transition-colors`}>
                Truyện chữ
              </Link>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSearchModalOpen(true)}
                className="text-foreground/70 hover:text-primary"
              >
                <SearchIcon className="h-5 w-5" />
              </Button>
            </nav>
            
            {/* User actions */}
            <div className="flex items-center space-x-4">
              <ToggleTheme />
              
              {/* Nút bật/tắt quảng cáo */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleAds}
                title={showAds ? "Tắt quảng cáo" : "Bật quảng cáo"}
                className="text-foreground/70 hover:text-primary"
              >
                <BanIcon className={`h-5 w-5 ${!showAds ? 'text-red-500' : ''}`} />
              </Button>
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs font-medium text-primary">
                        {formatCurrency(user.balance)}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Hồ sơ</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile?tab=history" className="flex items-center cursor-pointer">
                        <History className="mr-2 h-4 w-4" />
                        <span>Truyện đã đọc</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile?tab=favorites" className="flex items-center cursor-pointer">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>Yêu thích</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/payment" className="flex items-center cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Nạp tiền</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Quản trị</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                      className="cursor-pointer"
                    >
                      <LogOutIcon className="mr-2 h-4 w-4" />
                      <span>Đăng xuất</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="default" size="sm">
                  <Link href="/auth">Đăng nhập</Link>
                </Button>
              )}
              
              {/* Mobile menu button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden" 
                onClick={toggleMobileMenu}
              >
                <MenuIcon className="h-6 w-6" />
              </Button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <nav className="flex flex-col space-y-4">
                <Link 
                  href="/" 
                  className={`${location === '/' ? 'text-primary' : 'text-foreground/70'} font-medium`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <HomeIcon className="h-5 w-5" />
                    <span>Trang chủ</span>
                  </div>
                </Link>
                <Link 
                  href="/?type=manga" 
                  className={`${location === '/?type=manga' ? 'text-primary' : 'text-foreground/70'} font-medium`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <BookOpenIcon className="h-5 w-5" />
                    <span>Truyện tranh</span>
                  </div>
                </Link>
                <Link 
                  href="/?type=novel" 
                  className={`${location === '/?type=novel' ? 'text-primary' : 'text-foreground/70'} font-medium`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <BookOpenIcon className="h-5 w-5" />
                    <span>Truyện chữ</span>
                  </div>
                </Link>
                <Button 
                  variant="ghost" 
                  className="justify-start px-0 font-medium text-foreground/70" 
                  onClick={() => {
                    setSearchModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <SearchIcon className="h-5 w-5" />
                    <span>Tìm kiếm</span>
                  </div>
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
      
      {/* Popup Ad - Only shown if not on reading pages */}
      {shouldShowAdsOnPage && (
        <PopupAd 
          title="Quảng cáo" 
          adImage="https://via.placeholder.com/400x300?text=Advertisement"
          adLink="#"
          width={400}
          height={300}
          timerMinutes={15}
          delay={3000} // Show after 3 seconds
        />
      )}
      
      {/* Overlay Ad - Only shown if not on reading pages */}
      {shouldShowAdsOnPage && (
        <OverlayAd 
          adImage="https://via.placeholder.com/500x500?text=Advertisement"
          adLink="#"
          position="center"
          width="500px"
          height="500px"
          timerMinutes={30}
          delay={1000} // Show after 1 second
        />
      )}

      {/* Main content */}
      <main className="flex-grow relative">
        {/* Banner quảng cáo trên */}
        {showAds && showBanners && (
          <div className="container mx-auto px-4 mt-4">
            <BannerAd 
              position="top" 
              className="mx-auto"
            />
          </div>
        )}
        
        {children}
        
        {/* Banner quảng cáo dưới */}
        {showAds && showBanners && (
          <div className="container mx-auto px-4 mb-4">
            <BannerAd 
              position="bottom" 
              className="mx-auto"
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">GocTruyenNho</h3>
              <p className="text-muted-foreground mb-4">Nền tảng đọc truyện tranh và truyện chữ hàng đầu Việt Nam.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Thể loại</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/?genres=Action" className="hover:text-primary">Hành động</Link></li>
                <li><Link href="/?genres=Adventure" className="hover:text-primary">Phiêu lưu</Link></li>
                <li><Link href="/?genres=Romance" className="hover:text-primary">Tình cảm</Link></li>
                <li><Link href="/?genres=Fantasy" className="hover:text-primary">Viễn tưởng</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Hướng dẫn đọc truyện</a></li>
                <li><a href="#" className="hover:text-primary">Câu hỏi thường gặp</a></li>
                <li><a href="#" className="hover:text-primary">Báo lỗi</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Pháp lý</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-primary">Chính sách bảo mật</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-6 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} GocTruyenNho. Tất cả các quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;
