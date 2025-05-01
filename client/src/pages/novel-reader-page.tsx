import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Chapter, ChapterContent } from "@shared/schema";
import { ReaderLayout } from "@/components/layouts/reader-layout";
import { UnlockModal } from "@/components/shared/unlock-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, LockIcon, AlertTriangle, Settings } from "lucide-react";

interface NovelReaderPageProps {
  contentId: number;
  chapterNumber: number;
}

export function NovelReaderPage({ contentId, chapterNumber }: NovelReaderPageProps) {
  const { user } = useAuth();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  
  // Fetch chapter details using the new endpoint with contentId and chapterNumber
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [`/api/content/${contentId}/chapter/${chapterNumber}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/content/${contentId}/chapter/${chapterNumber}`);
      return res.json();
    }
  });
  
  // Fetch novel details (for title and chapter list)
  const { data: novelDetails } = useQuery({
    queryKey: [`/api/content/${contentId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/content/${contentId}`);
      return res.json();
    },
    enabled: !!contentId
  });
  
  // Handle chapter list toggle
  const handleChapterListToggle = () => {
    setShowChapterList(!showChapterList);
  };
  
  // Get sorted chapters for navigation
  const getSortedChapters = () => {
    if (!novelDetails?.chapters) return [];
    return [...novelDetails.chapters].sort((a, b) => a.number - b.number);
  };
  
  // Find previous and next chapter numbers for navigation
  // We'll use the navigation info from the API response if available
  let prevChapterNumber, nextChapterNumber;
  
  if (data && data.navigation) {
    // Use the navigation data from the API
    prevChapterNumber = data.navigation.prevChapter?.number;
    nextChapterNumber = data.navigation.nextChapter?.number;
  } else {
    // Fallback to manually calculating
    const sortedChapters = getSortedChapters();
    const currentIndex = sortedChapters.findIndex(chapter => chapter.number === chapterNumber);
    
    prevChapterNumber = currentIndex > 0 ? sortedChapters[currentIndex - 1].number : undefined;
    nextChapterNumber = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1].number : undefined;
  }
  
  // Handle unlock success
  const handleUnlockSuccess = () => {
    refetch();
  };
  
  // Show unlock modal when chapter is locked
  useEffect(() => {
    if (data && data.chapter.isLocked && !data.isUnlocked) {
      setShowUnlockModal(true);
    }
  }, [data]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải...</span>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Không thể tải chương</h2>
          <p className="text-muted-foreground mb-4">
            Đã xảy ra lỗi khi tải nội dung chương này. Vui lòng thử lại sau.
          </p>
          <Button asChild>
            <Link href={`/truyen/${contentId}`}>Quay lại trang truyện</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Check if chapter data exists
  if (!data || !data.chapter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Không tìm thấy chương</h2>
          <p className="text-muted-foreground mb-4">
            Chương này không tồn tại hoặc đã bị xóa.
          </p>
          <Button asChild>
            <Link href={`/truyen/${contentId}`}>Quay lại trang truyện</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const { chapter, content: chapterContent, chapterContent: chapterContentList, isUnlocked } = data;
  const novelTitle = novelDetails?.content?.title || "Đang tải...";
  
  // Chapter locked state
  if (chapter.isLocked && !isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="max-w-md p-6 text-center">
          <LockIcon className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Chương bị khóa</h2>
          <p className="text-muted-foreground mb-6">
            Chương này yêu cầu mở khóa để đọc. Vui lòng mở khóa để tiếp tục.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setShowUnlockModal(true)}>
              Mở khóa chương
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/truyen/${contentId}`}>Quay lại</Link>
            </Button>
          </div>
          
          {/* Unlock Modal */}
          <UnlockModal
            isOpen={showUnlockModal}
            onClose={() => setShowUnlockModal(false)}
            chapter={chapter}
            onUnlockSuccess={handleUnlockSuccess}
          />
        </div>
      </div>
    );
  }
  
  // Extract novel content (trước tiên dùng chapterContent string từ API đã nâng cấp)
  const novelContent = chapterContent || (chapterContentList && chapterContentList.length > 0 
    ? chapterContentList[0]?.content 
    : null);
  
  // No content state
  if (!novelContent) {
    return (
      <ReaderLayout
        contentId={contentId}
        chapterId={chapter.id}
        contentType="novel"
        title={novelTitle}
        chapterTitle={chapter.title || `Chương ${chapter.number}`}
        chapterNumber={chapter.number}
        prevChapterId={data.navigation?.prevChapter?.id}
        nextChapterId={data.navigation?.nextChapter?.id}
        onChapterListToggle={handleChapterListToggle}
      >
        <div className="flex flex-col items-center justify-center py-16">
          <Alert className="max-w-md">
            <AlertTitle>Không có nội dung</AlertTitle>
            <AlertDescription>
              Chương này hiện không có nội dung. Vui lòng quay lại sau.
            </AlertDescription>
          </Alert>
        </div>
        
        {/* Chapter List Side Sheet */}
        <Sheet open={showChapterList} onOpenChange={setShowChapterList}>
          <SheetContent side="right">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-semibold mb-4">Danh sách chương</h3>
              <div className="flex-grow overflow-y-auto">
                {getSortedChapters().map(ch => (
                  <div key={ch.id} className="py-2 border-b border-border">
                    <Link
                      href={`/truyen/${contentId}/chapter/${ch.number}`}
                      className={`block py-1 px-2 rounded hover:bg-muted ${ch.id === chapter.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
                      onClick={() => setShowChapterList(false)}
                    >
                      <div className="flex items-center justify-between">
                        <span>Chương {ch.number}</span>
                        {ch.isLocked && <LockIcon className="h-3 w-3" />}
                      </div>
                      {ch.title && <span className="text-sm text-muted-foreground">{ch.title}</span>}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </ReaderLayout>
    );
  }
  
  // Default settings - define outside the component for stability
  const defaultSettings = {
    fontSize: 14,
    fontFamily: 'Times New Roman',
    textColor: '',
    backgroundColor: '',
  };
  
  // Novel reader settings with localStorage
  const [readerSettings, setReaderSettings] = useState(() => {
    // Try to get settings from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('novelReaderSettings');
        return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
      } catch (e) {
        console.error('Error loading reader settings:', e);
      }
    }
    return defaultSettings;
  });
  
  // Handle settings change and save to localStorage
  const updateSettings = (newSettings: any) => {
    const updatedSettings = { ...readerSettings, ...newSettings };
    setReaderSettings(updatedSettings);
    try {
      localStorage.setItem('novelReaderSettings', JSON.stringify(updatedSettings));
    } catch (e) {
      console.error('Error saving reader settings:', e);
    }
  };
  
  // Vietnamese optimized fonts
  const fontOptions = [
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Noto Sans', label: 'Noto Sans' },
    { value: 'Noto Serif', label: 'Noto Serif' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Quicksand', label: 'Quicksand' },
    { value: 'Be Vietnam Pro', label: 'Be Vietnam Pro' },
    { value: 'Josefin Sans', label: 'Josefin Sans' },
  ];
  
  // Font size options
  const fontSizeOptions = [
    { value: 12, label: 'Rất nhỏ' },
    { value: 14, label: 'Nhỏ' },
    { value: 16, label: 'Vừa' },
    { value: 18, label: 'Lớn' },
    { value: 20, label: 'Rất lớn' },
    { value: 22, label: 'Cực lớn' },
  ];
  
  // Determine text color based on theme if not set manually
  const { theme } = useTheme();
  const defaultTextColor = theme === 'dark' ? 'white' : 'black';
  
  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  
  // Parse HTML content safely
  const renderFormattedContent = () => {
    if (!novelContent) return null;
    
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: novelContent }} 
        className="novel-content"
      />
    );
  };
  
  return (
    <ReaderLayout
      contentId={contentId}
      chapterId={chapter.id}
      contentType="novel"
      title={novelTitle}
      chapterTitle={chapter.title || `Chương ${chapter.number}`}
      chapterNumber={chapter.number}
      prevChapterId={data.navigation?.prevChapter?.id}
      nextChapterId={data.navigation?.nextChapter?.id}
      onChapterListToggle={handleChapterListToggle}
    >
      <div className="novel-reader relative">
        {/* Reader settings button */}
        <div className="absolute right-0 top-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1"
          >
            <Settings className="h-4 w-4" />
            <span className="text-xs">Cài đặt</span>
          </Button>
        </div>
        
        <h1 className="text-2xl font-semibold mb-6 pr-24">
          Chương {chapter.number}: {chapter.title || ''}
        </h1>
        
        <div 
          className="novel-content-container"
          style={{ 
            fontFamily: readerSettings.fontFamily, 
            fontSize: `${readerSettings.fontSize}px`,
            color: readerSettings.textColor || defaultTextColor,
            backgroundColor: readerSettings.backgroundColor || '',
            padding: readerSettings.backgroundColor ? '1rem' : '0',
            borderRadius: readerSettings.backgroundColor ? '0.5rem' : '0',
          }}
        >
          {renderFormattedContent()}
        </div>
      </div>
      
      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tùy chỉnh hiển thị</DialogTitle>
            <DialogDescription>
              Điều chỉnh giao diện đọc truyện theo ý thích của bạn
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fontFamily">Phông chữ</Label>
              <Select 
                value={readerSettings.fontFamily} 
                onValueChange={(value) => updateSettings({ fontFamily: value })}
              >
                <SelectTrigger id="fontFamily">
                  <SelectValue placeholder="Chọn phông chữ" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map(font => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="fontSize">Cỡ chữ</Label>
              <Select 
                value={readerSettings.fontSize.toString()} 
                onValueChange={(value) => updateSettings({ fontSize: parseInt(value) })}
              >
                <SelectTrigger id="fontSize">
                  <SelectValue placeholder="Chọn cỡ chữ" />
                </SelectTrigger>
                <SelectContent>
                  {fontSizeOptions.map(size => (
                    <SelectItem key={size.value} value={size.value.toString()}>
                      {size.label} ({size.value}px)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="textColor">Màu chữ</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={readerSettings.textColor || defaultTextColor}
                  onChange={(e) => updateSettings({ textColor: e.target.value })}
                  className="w-12 h-8 p-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateSettings({ textColor: '' })}
                >
                  Mặc định
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="backgroundColor">Màu nền</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={readerSettings.backgroundColor || (theme === 'dark' ? '#1e1e2e' : '#ffffff')}
                  onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                  className="w-12 h-8 p-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateSettings({ backgroundColor: '' })}
                >
                  Mặc định
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowSettings(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Chapter List Side Sheet */}
      <Sheet open={showChapterList} onOpenChange={setShowChapterList}>
        <SheetContent side="right">
          <div className="h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Danh sách chương</h3>
            <div className="flex-grow overflow-y-auto">
              {getSortedChapters().map(ch => (
                <div key={ch.id} className="py-2 border-b border-border">
                  <Link
                    href={`/truyen/${contentId}/chapter/${ch.number}`}
                    className={`block py-1 px-2 rounded hover:bg-muted ${ch.id === chapter.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
                    onClick={() => setShowChapterList(false)}
                  >
                    <div className="flex items-center justify-between">
                      <span>Chương {ch.number}</span>
                      {ch.isLocked && <LockIcon className="h-3 w-3" />}
                    </div>
                    {ch.title && <span className="text-sm text-muted-foreground">{ch.title}</span>}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </ReaderLayout>
  );
}

export default NovelReaderPage;