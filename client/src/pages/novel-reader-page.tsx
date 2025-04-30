import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Chapter, ChapterContent } from "@shared/schema";
import { ReaderLayout } from "@/components/layouts/reader-layout";
import { UnlockModal } from "@/components/shared/unlock-modal";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, LockIcon, AlertTriangle } from "lucide-react";

interface NovelReaderPageProps {
  contentId: number;
  chapterId: number;
}

export function NovelReaderPage({ contentId, chapterId }: NovelReaderPageProps) {
  const { user } = useAuth();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  
  // Fetch chapter details
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [`/api/chapters/${chapterId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/chapters/${chapterId}`);
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
  
  // Find previous and next chapter IDs
  const getAdjacentChapterIds = () => {
    const sortedChapters = getSortedChapters();
    const currentIndex = sortedChapters.findIndex(chapter => chapter.id === chapterId);
    
    const prevChapterId = currentIndex > 0 ? sortedChapters[currentIndex - 1].id : undefined;
    const nextChapterId = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1].id : undefined;
    
    return { prevChapterId, nextChapterId };
  };
  
  // Get chapter information for navigation
  const { prevChapterId, nextChapterId } = getAdjacentChapterIds();
  
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
        chapterId={chapterId}
        contentType="novel"
        title={novelTitle}
        chapterTitle={chapter.title || `Chương ${chapter.number}`}
        chapterNumber={chapter.number}
        prevChapterId={prevChapterId}
        nextChapterId={nextChapterId}
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
                      href={`/truyen/${contentId}/chapter-${ch.number}`}
                      className={`block py-1 px-2 rounded hover:bg-muted ${ch.id === chapterId ? 'bg-primary/10 text-primary font-medium' : ''}`}
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
  
  return (
    <ReaderLayout
      contentId={contentId}
      chapterId={chapterId}
      contentType="novel"
      title={novelTitle}
      chapterTitle={chapter.title || `Chương ${chapter.number}`}
      chapterNumber={chapter.number}
      prevChapterId={prevChapterId}
      nextChapterId={nextChapterId}
      onChapterListToggle={handleChapterListToggle}
    >
      <div className="novel-reader">
        <h1 className="text-2xl font-semibold mb-6">
          Chương {chapter.number}: {chapter.title || ''}
        </h1>
        
        <div className="whitespace-pre-line">
          {novelContent}
        </div>
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
                    href={`/truyen/${contentId}/chapter-${ch.number}`}
                    className={`block py-1 px-2 rounded hover:bg-muted ${ch.id === chapterId ? 'bg-primary/10 text-primary font-medium' : ''}`}
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