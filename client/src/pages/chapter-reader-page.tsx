import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ChevronLeft, ChevronRight, Settings, Home, List, X } from "lucide-react";
import { useLocation, Link } from "wouter";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface ChapterReaderPageProps {
  contentId: number;
  chapterNumber: number;
}

export function ChapterReaderPage({ contentId, chapterNumber }: ChapterReaderPageProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // State cho các tùy chọn đọc truyện
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState("sans");
  const [lineHeight, setLineHeight] = useState(1.5);
  const [theme, setTheme] = useState("light");
  const [showNav, setShowNav] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Lazy loading cho ảnh manga
  const [loadedImages, setLoadedImages] = useState<number[]>([0, 1]); // Mặc định tải 2 ảnh đầu tiên
  
  // Fetch thông tin nội dung
  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: [`/api/content/${contentId}`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/content/${contentId}`);
        return await res.json();
      } catch (error) {
        console.error("Error fetching content:", error);
        return null;
      }
    }
  });

  // Fetch dữ liệu chương dựa trên chapter number thay vì chapterId
  const { data: chaptersListData } = useQuery({
    queryKey: [`/api/chapters/content/${contentId}`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/chapters/content/${contentId}`);
        const data = await res.json();
        return data.chapters || [];
      } catch (error) {
        console.error("Error fetching chapters list:", error);
        return [];
      }
    },
    enabled: !!contentId
  });

  // Tìm chapterId dựa trên chapter number
  const chapterId = React.useMemo(() => {
    if (!chaptersListData) return null;
    const chapter = chaptersListData.find(ch => ch.number === chapterNumber);
    return chapter?.id || null;
  }, [chaptersListData, chapterNumber]);

  // Fetch dữ liệu chương dựa trên chapterId đã tìm được
  const { data: chapterData, isLoading: chapterLoading } = useQuery({
    queryKey: [`/api/chapters/${chapterId}`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/chapters/${chapterId}`);
        return await res.json();
      } catch (error) {
        console.error("Error fetching chapter:", error);
        return null;
      }
    },
    enabled: !!contentId && !!chapterId
  });

  // Sử dụng chaptersListData đã fetch ở trên
  
  // Tính số chương hiện tại và tổng số chương
  const [currentChapterIndex, totalChapters] = React.useMemo(() => {
    if (!chaptersListData || !chapterData) return [0, 0];
    
    const sortedChapters = [...chaptersListData].sort((a, b) => a.number - b.number);
    const index = sortedChapters.findIndex(chapter => chapter.id === chapterData.id);
    return [index, sortedChapters.length];
  }, [chaptersListData, chapterData]);

  // Chuyển đến chương trước hoặc chương tiếp theo
  const navigateToChapter = (direction: 'prev' | 'next') => {
    if (!chaptersListData || chaptersListData.length === 0) return;
    
    const sortedChapters = [...chaptersListData].sort((a, b) => a.number - b.number);
    let nextIndex = direction === 'next' ? currentChapterIndex + 1 : currentChapterIndex - 1;
    
    if (nextIndex < 0) {
      toast({
        title: "Đây là chương đầu tiên",
        description: "Không thể chuyển đến chương trước.",
        variant: "default"
      });
      return;
    }
    
    if (nextIndex >= sortedChapters.length) {
      toast({
        title: "Đây là chương mới nhất",
        description: "Không có chương tiếp theo.",
        variant: "default"
      });
      return;
    }
    
    setLocation(`/truyen/${contentId}/chapter-${sortedChapters[nextIndex].number}`);
  };

  // Tải thêm ảnh khi cuộn xuống (dành cho manga)
  const handleImageInView = (index: number) => {
    if (!loadedImages.includes(index)) {
      setLoadedImages(prev => [...prev, index]);
    }
    
    // Tự động tải trước 2 ảnh tiếp theo
    const nextIndex = index + 1;
    const nextNextIndex = index + 2;
    
    if (!loadedImages.includes(nextIndex)) {
      setLoadedImages(prev => [...prev, nextIndex]);
    }
    
    if (!loadedImages.includes(nextNextIndex)) {
      setLoadedImages(prev => [...prev, nextNextIndex]);
    }
  };

  // Toggle nav bar
  const toggleNav = () => {
    setShowNav(prev => !prev);
  };

  // Lưu cài đặt đọc vào localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('reader-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setFontSize(settings.fontSize || 14);
        setFontFamily(settings.fontFamily || 'sans');
        setLineHeight(settings.lineHeight || 1.5);
        setTheme(settings.theme || 'light');
      } catch (error) {
        console.error('Error loading reader settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    const settings = { fontSize, fontFamily, lineHeight, theme };
    localStorage.setItem('reader-settings', JSON.stringify(settings));
  }, [fontSize, fontFamily, lineHeight, theme]);

  // Lấy các chức năng hỗ trợ
  const content = contentData?.content || contentData;
  const chapter = chapterData?.chapter || chapterData;
  const contentType = content?.type || 'novel';
  
  // Thêm lượt xem khi tải trang
  useEffect(() => {
    if (chapter?.id) {
      // Hàm cập nhật lượt xem - trong thực tế sẽ gọi một API
      const updateViewCount = async () => {
        try {
          // Cập nhật lượt xem chương
        } catch (error) {
          console.error("Error updating view count:", error);
        }
      };
      
      updateViewCount();
    }
  }, [chapter?.id]);
  
  // Loading state
  if (contentLoading || chapterLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải...</span>
      </div>
    );
  }
  
  // Error state
  if (!content || !chapter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy nội dung</h2>
        <p className="text-muted-foreground mb-6">Nội dung bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
        <Button asChild>
          <Link href="/">Quay về trang chủ</Link>
        </Button>
      </div>
    );
  }

  // CSS cho phần đọc nội dung novel
  const novelContentStyle = {
    fontFamily: fontFamily === 'sans' ? 'system-ui, sans-serif' : 
               fontFamily === 'serif' ? 'Georgia, serif' : 
               fontFamily === 'mono' ? 'monospace' : 'system-ui, sans-serif',
    fontSize: `${fontSize}px`,
    lineHeight: lineHeight
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
      {/* Navigation bar */}
      {showNav && (
        <header className={`sticky top-0 z-40 border-b ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="container flex h-14 max-w-screen-2xl items-center">
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/truyen/${contentId}`}>
                    <Home className="h-5 w-5" />
                  </Link>
                </Button>
                <div className="text-sm font-medium mr-8">
                  {content.title} - Chương {chapter.number}{chapter.title ? `: ${chapter.title}` : ''}
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigateToChapter('prev')}
                  disabled={currentChapterIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <div className="text-sm font-medium">
                  {currentChapterIndex + 1}/{totalChapters}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigateToChapter('next')}
                  disabled={currentChapterIndex === totalChapters - 1}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <List className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Danh sách chương</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
                      <div className="space-y-1 py-2">
                        {chaptersListData && [...chaptersListData]
                          .sort((a, b) => a.number - b.number)
                          .map((chapterItem) => (
                            <Link 
                              key={chapterItem.id}
                              href={`/truyen/${contentId}/chapter-${chapterItem.number}`}
                              className={`block px-3 py-2 rounded-md text-sm ${
                                chapterItem.id === chapter.id 
                                  ? (theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200') 
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              Chương {chapterItem.number}{chapterItem.title ? `: ${chapterItem.title}` : ''}
                            </Link>
                          ))}
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
                
                <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Tùy chỉnh đọc truyện</SheetTitle>
                    </SheetHeader>
                    <div className="py-6 space-y-6">
                      {contentType === 'novel' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="font-family">Kiểu chữ</Label>
                            <Select 
                              value={fontFamily} 
                              onValueChange={setFontFamily}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn kiểu chữ" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sans">Sans-serif</SelectItem>
                                <SelectItem value="serif">Serif</SelectItem>
                                <SelectItem value="mono">Monospace</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Cỡ chữ: {fontSize}px</Label>
                            <Slider
                              value={[fontSize]}
                              min={12}
                              max={24}
                              step={1}
                              onValueChange={(values) => setFontSize(values[0])}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Khoảng cách dòng: {lineHeight}x</Label>
                            <Slider
                              value={[lineHeight * 10]}
                              min={10}
                              max={30}
                              step={1}
                              onValueChange={(values) => setLineHeight(values[0] / 10)}
                            />
                          </div>
                        </>
                      )}

                      <div className="space-y-2">
                        <Label>Chế độ màu</Label>
                        <RadioGroup value={theme} onValueChange={setTheme} className="flex gap-6">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="light" id="light" />
                            <Label htmlFor="light">Sáng</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="dark" id="dark" />
                            <Label htmlFor="dark">Tối</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                
                <Button variant="ghost" size="icon" onClick={toggleNav}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Content area */}
      <main 
        className={`flex-1 py-8 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}
        onClick={showNav ? undefined : toggleNav}
      >
        <div className="container max-w-screen-md mx-auto px-4">
          {/* Chapter title */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">
              Chương {chapter.number}{chapter.title ? `: ${chapter.title}` : ''}
            </h1>
            {chapter.releaseDate && (
              <p className="text-sm text-muted-foreground mt-1">
                Ngày đăng: {new Date(chapter.releaseDate).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>

          {/* Chapter content - Novel */}
          {contentType === 'novel' && (
            <div 
              className="prose max-w-none dark:prose-invert"
              style={novelContentStyle}
              dangerouslySetInnerHTML={{ __html: chapter.content || 'Không có nội dung.' }}
            />
          )}

          {/* Chapter content - Manga */}
          {contentType === 'manga' && (
            <div className="space-y-4">
              {chapter.images && chapter.images.map((image, index) => (
                <div 
                  key={index}
                  className="w-full"
                  onLoad={() => handleImageInView(index)}
                >
                  {loadedImages.includes(index) ? (
                    <img 
                      src={image} 
                      alt={`Trang ${index + 1}`}
                      className="w-full h-auto rounded-md"
                      loading={index < 2 ? 'eager' : 'lazy'}
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Chapter navigation buttons */}
          <div className="mt-10 py-4 flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigateToChapter('prev')}
              disabled={currentChapterIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Chương trước
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigateToChapter('next')}
              disabled={currentChapterIndex === totalChapters - 1}
            >
              Chương sau
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ChapterReaderPage;