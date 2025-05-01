import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Chapter, ChapterContent, Content } from "@shared/schema";
import { ReaderLayout } from "@/components/layouts/reader-layout";
import { UnlockModal } from "@/components/shared/unlock-modal";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, LockIcon, AlertTriangle } from "lucide-react";
import { getMangaPageImages } from "@/lib/utils";

interface MangaReaderPageProps {
  contentId: number;
  chapterNumber: number;
}

export function MangaReaderPage({
  contentId,
  chapterNumber,
}: MangaReaderPageProps) {
  const { user } = useAuth();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);

  // Fetch chapter details using the new endpoint with contentId and chapterNumber
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [`/api/content/${contentId}/chapter/${chapterNumber}`],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/content/${contentId}/chapter/${chapterNumber}`,
      );
      return res.json();
    },
  });

  // Fetch manga details (for title and chapter list)
  const { data: mangaDetails } = useQuery({
    queryKey: [`/api/content/${contentId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/content/${contentId}`);
      return res.json();
    },
    enabled: !!contentId,
  });

  // Handle chapter list toggle
  const handleChapterListToggle = () => {
    setShowChapterList(!showChapterList);
  };

  // Get sorted chapters for navigation
  const getSortedChapters = () => {
    if (!mangaDetails?.chapters) return [];
    return [...mangaDetails.chapters].sort((a, b) => a.number - b.number);
  };

  // We don't need to manually calculate previous and next chapter numbers
  // since they are now included in the API response in the navigation field

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

  const { chapter, content: chapterContent, isUnlocked } = data;
  const mangaTitle = mangaDetails?.content?.title || "Đang tải...";

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

  // No content state
  if (!chapterContent || chapterContent.length === 0) {
    return (
      <ReaderLayout
        contentId={contentId}
        chapterId={chapter.number}
        contentType="manga"
        title={mangaTitle}
        chapterTitle={chapter.title || `Chương ${chapter.number}`}
        chapterNumber={chapter.number}
        prevChapterId={data.navigation?.prevChapter?.number}
        nextChapterId={data.navigation?.nextChapter?.number}
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
                {getSortedChapters().map((ch) => (
                  <div key={ch.id} className="py-2 border-b border-border">
                    <Link
                      href={`/truyen/${contentId}/chapter/${ch.number}`}
                      className={`block py-1 px-2 rounded hover:bg-muted ${ch.id === chapter.id ? "bg-primary/10 text-primary font-medium" : ""}`}
                      onClick={() => setShowChapterList(false)}
                    >
                      <div className="flex items-center justify-between">
                        <span>Chương {ch.number}</span>
                        {ch.isLocked && <LockIcon className="h-3 w-3" />}
                      </div>
                      {ch.title && (
                        <span className="text-sm text-muted-foreground">
                          {ch.title}
                        </span>
                      )}
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

  // Sorting and processing manga pages
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<"vertical" | "horizontal">(
    "vertical",
  );
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [isImageLoading, setIsImageLoading] = useState<boolean[]>([]);

  // Sort manga pages by page order
  const sortedPages = [...chapterContent];
  console.log("Chapter content data:", sortedPages);
  
  const pageImages = useMemo(() => {
    if (sortedPages && sortedPages.length > 0) {
      for (const contentItem of sortedPages) {
        try {
          if (contentItem.content) {
            // Xử lý chuỗi JSON để loại bỏ dấu phẩy thừa ở cuối
            const contentStr = contentItem.content.trim();
            const cleanedContent = contentStr.replace(/,\s*}$/, "}");
            
            // Parse JSON
            const jsonContent = JSON.parse(cleanedContent);
            
            // Check if it has the expected format (numeric keys)
            const hasNumericKeys = Object.keys(jsonContent).some(key => !isNaN(parseInt(key)));
            
            if (hasNumericKeys) {
              // Sort by numeric keys and extract URLs
              const sortedImages = Object.entries(jsonContent)
                .sort(([keyA], [keyB]) => parseInt(keyA) - parseInt(keyB))
                .map(([_, url]) => url as string)
                .filter((url) => url && typeof url === 'string' && url.trim() !== "");
              
              console.log("Successfully parsed manga pages:", sortedImages);
              
              if (sortedImages.length > 0) {
                return sortedImages;
              }
            }
          }
        } catch (e) {
          console.error("Error parsing JSON from chapter content:", e, contentItem.content);
        }
      }
      
      // Fallback to extracting image URLs from HTML content
      for (const contentItem of sortedPages) {
        if (contentItem.content) {
          const imgRegex = /<img[^>]+src="([^"'>]+)"/g;
          const images: string[] = [];
          let match;
          
          while ((match = imgRegex.exec(contentItem.content)) !== null) {
            images.push(match[1]);
          }
          
          if (images.length > 0) {
            console.log("Extracted images from HTML content:", images);
            return images;
          }
        }
      }
    }

    // If no images found, return empty array
    return [];
  }, [chapterContent]);
  
  // Use actual images or empty array, avoid using fallback synthetic data
  const displayImages = pageImages.length > 0 ? pageImages : [];

  // Initialize loading state for all images
  useEffect(() => {
    setIsImageLoading(new Array(displayImages.length).fill(true));
  }, [displayImages.length]);

  // Image loading handler
  const handleImageLoad = (index: number) => {
    setIsImageLoading((prev) => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });

    // Add to loaded images
    setLoadedImages((prev) => {
      if (!prev.includes(displayImages[index])) {
        return [...prev, displayImages[index]];
      }
      return prev;
    });
  };

  // Navigation in horizontal mode
  const goToNextPage = () => {
    if (currentPage < displayImages.length) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (viewMode === "horizontal") {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowRight") {
          goToNextPage();
        } else if (e.key === "ArrowLeft") {
          goToPrevPage();
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [viewMode, currentPage, displayImages.length]);

  // Render content based on view mode
  const renderMangaContent = () => {
    if (viewMode === "vertical") {
      return (
        <div className="manga-reader space-y-6">
          {displayImages.map((imageUrl, index) => (
            <div key={index} className="relative mx-auto">
              {isImageLoading[index] && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <img
                src={imageUrl}
                alt={`Trang ${index + 1}`}
                className={`w-full max-w-4xl mx-auto shadow-md rounded transition-opacity duration-300 ${isImageLoading[index] ? "opacity-40" : "opacity-100"}`}
                style={{
                  width: `${zoom}%`,
                  maxWidth: `${Math.max(zoom, 100)}%`,
                }}
                loading={index < 3 ? "eager" : "lazy"}
                onLoad={() => handleImageLoad(index)}
              />
              <div className="text-center text-sm text-muted-foreground mt-1">
                Trang {index + 1} / {displayImages.length}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      // Horizontal paged view
      return (
        <div className="manga-reader relative flex flex-col items-center justify-center min-h-[70vh]">
          <div className="relative mx-auto my-4">
            {isImageLoading[currentPage - 1] && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <img
              src={displayImages[currentPage - 1]}
              alt={`Trang ${currentPage}`}
              className={`max-h-[70vh] mx-auto shadow-md rounded transition-opacity duration-300 ${isImageLoading[currentPage - 1] ? "opacity-40" : "opacity-100"}`}
              style={{ width: `${zoom}%`, maxWidth: `${Math.max(zoom, 100)}%` }}
              onLoad={() => handleImageLoad(currentPage - 1)}
            />
          </div>

          <div className="flex items-center justify-between w-full max-w-lg mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
            >
              Trang trước
            </Button>

            <div className="text-center text-sm">
              Trang {currentPage} / {displayImages.length}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === displayImages.length}
            >
              Trang sau
            </Button>
          </div>
        </div>
      );
    }
  };

  // Settings for manga reader
  const zoomOptions = [75, 85, 100, 115, 130, 150];

  return (
    <ReaderLayout
      contentId={contentId}
      chapterId={chapter.id}
      contentType="manga"
      title={mangaTitle}
      chapterTitle={chapter.title || `Chương ${chapter.number}`}
      chapterNumber={chapter.number}
      prevChapterId={data.navigation?.prevChapter?.id}
      nextChapterId={data.navigation?.nextChapter?.id}
      onChapterListToggle={handleChapterListToggle}
    >
      <div className="sticky top-[72px] z-10 flex justify-between items-center mb-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium">Chế độ xem:</div>
          <Button
            variant={viewMode === "vertical" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("vertical")}
            className="h-8"
          >
            Cuộn dọc
          </Button>
          <Button
            variant={viewMode === "horizontal" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("horizontal")}
            className="h-8"
          >
            Từng trang
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium">Zoom:</div>
          <select
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {zoomOptions.map((option) => (
              <option key={option} value={option}>
                {option}%
              </option>
            ))}
          </select>
        </div>
      </div>

      {renderMangaContent()}

      {/* Chapter List Side Sheet */}
      <Sheet open={showChapterList} onOpenChange={setShowChapterList}>
        <SheetContent side="right" className="w-[300px] sm:w-[350px] md:w-[400px]">
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Danh sách chương</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowChapterList(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text"
                  placeholder="Tìm chương..." 
                  className="pl-8"
                  value={searchChapter}
                  onChange={(e) => setSearchChapter(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto">
              {getSortedChapters()
                .filter(ch => 
                  searchChapter === '' || 
                  ch.title?.toLowerCase().includes(searchChapter.toLowerCase()) ||
                  `chương ${ch.number}`.includes(searchChapter.toLowerCase())
                )
                .map((ch) => (
                <div key={ch.id} className="py-1 border-b border-border">
                  <Link
                    href={`/truyen/${contentId}/chapter/${ch.number}`}
                    className={`block py-2 px-3 rounded-md hover:bg-muted transition-colors duration-200 ${
                      ch.id === chapter.id 
                        ? "bg-primary/10 text-primary font-medium border-l-4 border-primary pl-2" 
                        : ""
                    }`}
                    onClick={() => setShowChapterList(false)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {ch.id === chapter.id && <ChevronRight className="h-3 w-3 mr-1 text-primary" />}
                        <span>Chương {ch.number}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {ch.views > 0 && <EyeIcon className="h-3 w-3 text-muted-foreground" />}
                        {ch.isLocked && <LockIcon className="h-3 w-3 text-amber-500" />}
                      </div>
                    </div>
                    {ch.title && (
                      <span className="text-sm text-muted-foreground block mt-1 truncate">
                        {ch.title}
                      </span>
                    )}
                  </Link>
                </div>
              ))}
              
              {getSortedChapters().filter(ch => 
                searchChapter === '' || 
                ch.title?.toLowerCase().includes(searchChapter.toLowerCase()) || 
                `chương ${ch.number}`.includes(searchChapter.toLowerCase())
              ).length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <SearchX className="h-8 w-8 mx-auto mb-2" />
                  <p>Không tìm thấy chương</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </ReaderLayout>
  );
}

export default MangaReaderPage;
