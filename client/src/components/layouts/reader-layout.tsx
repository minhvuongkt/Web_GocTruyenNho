import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  List, 
  Menu,
  AlertCircle,
  X,
  Moon,
  Sun,
  PlusCircle,
  MinusCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReaderLayoutProps {
  children: React.ReactNode;
  contentId: number;
  chapterId: number;
  contentType: 'manga' | 'novel';
  title: string;
  chapterTitle: string;
  chapterNumber: number;
  prevChapterId?: number;
  nextChapterId?: number;
  onChapterListToggle?: () => void;
}

export function ReaderLayout({
  children,
  contentId,
  chapterId,
  contentType,
  title,
  chapterTitle,
  chapterNumber,
  prevChapterId,
  nextChapterId,
  onChapterListToggle
}: ReaderLayoutProps) {
  const { theme, setTheme } = useTheme();
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [fontSize, setFontSize] = useState(contentType === 'novel' ? 18 : 16);
  
  // Handle scroll to hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setNavbarVisible(false);
      } else {
        setNavbarVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  // Change font size (mainly for novel)
  const increaseFontSize = () => {
    if (fontSize < 24) {
      setFontSize(fontSize + 1);
    }
  };
  
  const decreaseFontSize = () => {
    if (fontSize > 14) {
      setFontSize(fontSize - 1);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header 
        className={`sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-border transition-transform duration-300 ${
          navbarVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="container mx-auto">
          <div className="flex justify-between items-center py-3 px-4">
            <div className="flex items-center space-x-4">
              <Link href={`/truyen/${contentId}`}>
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="hidden sm:block">
                <h1 className="text-sm font-medium line-clamp-1">{title}</h1>
                <p className="text-xs text-muted-foreground">Chương {chapterNumber}: {chapterTitle}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              
              {contentType === 'novel' && (
                <>
                  <Button variant="ghost" size="icon" onClick={decreaseFontSize}>
                    <MinusCircle className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={increaseFontSize}>
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </>
              )}
              
              <Button variant="ghost" size="icon" onClick={onChapterListToggle}>
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Reading Area */}
      <main className="flex-grow pb-20">
        <div 
          className={cn(
            "container mx-auto px-4 py-6",
            contentType === 'novel' ? "novel-reader" : "",
            contentType === 'manga' ? "manga-reader" : ""
          )}
          style={{ fontSize: `${fontSize}px` }}
        >
          {children}
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-border py-3 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            className="flex-1 max-w-[120px]"
            disabled={!prevChapterId}
            asChild={!!prevChapterId}
          >
            {prevChapterId ? (
              <Link href={`/truyen/${contentId}/chapter-${chapterNumber-1}`}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Chương trước
              </Link>
            ) : (
              <>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Chương trước
              </>
            )}
          </Button>
          
          <Button variant="outline" size="icon" asChild>
            <Link href={`/truyen/${contentId}`}>
              <Home className="h-4 w-4" />
            </Link>
          </Button>
          
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <AlertCircle className="h-4 w-4" />
            </Link>
          </Button>
          
          <Button
            variant="default"
            className="flex-1 max-w-[120px]"
            disabled={!nextChapterId}
            asChild={!!nextChapterId}
          >
            {nextChapterId ? (
              <Link href={`/truyen/${contentId}/chapter-${chapterNumber+1}`}>
                Chương tiếp
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            ) : (
              <>
                Chương tiếp
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper function to combine class names
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default ReaderLayout;
