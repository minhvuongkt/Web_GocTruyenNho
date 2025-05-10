import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ReaderLayout } from "@/components/layouts/reader-layout";
import { UnlockModal } from "@/components/shared/unlock-modal";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  LockIcon,
  AlertTriangle,
  Search,
  SearchX,
  ChevronRight,
  Eye as EyeIcon,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  LayoutGrid,
  BookOpen,
  ArrowUp,
  Home,
  Settings,
  Check,
} from "lucide-react";

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
  const [searchChapter, setSearchChapter] = useState("");
  const [viewStartTime, setViewStartTime] = useState<number | null>(null);
  const [viewTracked, setViewTracked] = useState(false);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);

  // Manga reader settings
  const [viewMode, setViewMode] = useState<"fit" | "original" | "width-fit">(
    "fit",
  );
  const [layout, setLayout] = useState<"vertical" | "horizontal" | "grid">(
    "vertical",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());
  const [imgLoadStatus, setImgLoadStatus] = useState<Map<number, boolean>>(
    new Map(),
  );

  // Fetch chapter details using the endpoint with contentId and chapterNumber
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
  const { data: mangaData } = useQuery({
    queryKey: [`/api/content/${contentId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/content/${contentId}`);
      return res.json();
    },
  });

  // Format for manga title
  const mangaTitle = mangaData?.content
    ? mangaData.content.alternativeTitle
      ? `${mangaData.content.title} (${mangaData.content.alternativeTitle})`
      : mangaData.content.title
    : "";

  // Fetch chapter list
  const { data: chaptersData } = useQuery({
    queryKey: [`/api/content/${contentId}/chapters`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/content/${contentId}/chapters`);
      return res.json();
    },
    enabled: !!contentId,
  });

  // Get chapter list from dedicated endpoint
  const chapterList = chaptersData || mangaData?.chapters || [];

  // Sort chapters by number
  const getSortedChapters = () => {
    return [...chapterList].sort((a, b) => b.number - a.number);
  };

  // Track view time for analytics and to count views (60-120 seconds)
  useEffect(() => {
    if (data?.isUnlocked && !viewTracked) {
      // Start view timer when content is loaded and unlocked
      if (!viewStartTime) {
        setViewStartTime(Date.now());
      }

      // Setup timer to count view after 60-120 seconds (using 60 seconds here)
      if (!viewTimerRef.current) {
        viewTimerRef.current = setTimeout(() => {
          trackPageView();
        }, 60000); // 60 seconds
      }
    }

    return () => {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
      }
    };
  }, [data, viewStartTime, viewTracked]);

  // Track page view after time threshold
  const trackPageView = async () => {
    if (!data?.chapter?.id || viewTracked) return;

    try {
      // Time spent on page in seconds
      const timeSpent = viewStartTime
        ? Math.floor((Date.now() - viewStartTime) / 1000)
        : 0;

      // Only count if user spent at least 60 seconds
      if (timeSpent >= 60) {
        console.log(
          `Tracking view for chapter ${data.chapter.id}, time spent: ${timeSpent}s`,
        );

        // Update view status to avoid multiple counts
        setViewTracked(true);

        // Could send additional analytics data here if needed
        await apiRequest("POST", `/api/chapters/${data.chapter.id}/view`, {
          timeSpent: timeSpent,
        });
      }
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  // Parse manga images from chapter content
  const getMangaImages = (): string[] => {
    if (!data?.chapterContent || data.chapterContent.length === 0) {
      return [];
    }

    // Reset image refs when content changes
    imageRefs.current = [];

    for (const contentItem of data.chapterContent) {
      if (!contentItem.content) continue;

      try {
        // Try to parse as JSON first
        const contentStr = contentItem.content.trim();
        let jsonData: Record<string, string>;

        try {
          jsonData = JSON.parse(contentStr);
        } catch (error) {
          // If parsing fails, try cleaning the string
          const cleanedContent = contentStr
            .replace(/,\s*}$/, "}") // Remove trailing commas
            .replace(/\\"/g, '"'); // Fix escaped quotes

          jsonData = JSON.parse(cleanedContent);
        }

        // Check for numeric keys (typical for manga page format)
        const numericKeys = Object.keys(jsonData).filter(
          (key) => !isNaN(parseInt(key)),
        );

        if (numericKeys.length > 0) {
          // Sort by page number and extract URLs
          return numericKeys
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((key) => jsonData[key])
            .filter(
              (url) => url && typeof url === "string" && url.trim() !== "",
            );
        }
      } catch (error) {
        console.error("Error parsing manga content:", error);

        // Fallback: try to extract image URLs from HTML
        try {
          const imgRegex = /<img[^>]+src="([^"'>]+)"/g;
          const images: string[] = [];
          let match;

          while ((match = imgRegex.exec(contentItem.content)) !== null) {
            images.push(match[1]);
          }

          if (images.length > 0) {
            return images;
          }
        } catch (htmlError) {
          console.error("Error extracting images from HTML:", htmlError);
        }
      }
    }

    return [];
  };

  // Image loading handler
  const handleImageLoad = (index: number) => {
    // Update image load status
    setImgLoadStatus((prev) => new Map(prev).set(index, true));
  };

  // Handle image error
  const handleImageError = (index: number) => {
    console.error(`Error loading image at index ${index}`);
  };

  // Setup intersection observer for lazy loading
  useEffect(() => {
    const options = {
      root: null, // Use viewport as root
      rootMargin: "100px", // Load images 100px before they enter viewport
      threshold: 0.1, // Trigger when 10% of image is visible
    };

    // Create observer to track visible images
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = parseInt(entry.target.getAttribute("data-index") || "-1");
        if (index >= 0) {
          setVisiblePages((prev) => {
            const newSet = new Set(prev);
            if (entry.isIntersecting) {
              newSet.add(index);
            } else {
              newSet.delete(index);
            }
            return newSet;
          });
        }
      });
    }, options);

    // Cleanup observer on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Update observer on imageRefs change
  useEffect(() => {
    // Connect observer to all image elements
    if (observerRef.current) {
      imageRefs.current.forEach((img) => {
        if (img) {
          observerRef.current?.observe(img);
        }
      });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [layout, data?.chapterContent]);

  // Get image refs
  const getImageRef = (index: number) => (node: HTMLImageElement | null) => {
    if (node) {
      imageRefs.current[index] = node;
    }
  };

  // If locked and not unlocked, show unlock modal
  useEffect(() => {
    if (data?.chapter) {
      // Kiểm tra nếu chapter bị khóa và chưa được mở khóa
      const isLocked = data.chapter.isLocked;
      const isUnlocked = data.chapter.isUnlocked;
      
      console.log(`Manga chapter status: isLocked=${isLocked}, isUnlocked=${isUnlocked}`);
      
      if (isLocked && !isUnlocked && user) {
        setShowUnlockModal(true);
      } else {
        setShowUnlockModal(false);
      }
    }
  }, [data, user]);

  // Handle unlock confirmation
  const handleUnlockConfirm = () => {
    setShowUnlockModal(false);
    refetch();
  };

  // Handle chapter list toggle
  const handleChapterListToggle = () => {
    setShowChapterList(!showChapterList);
  };

  // State to track UI behavior
  const [isTopButtonVisible, setIsTopButtonVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Track click outside settings popup to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettings) {
        const target = event.target as HTMLElement;
        if (
          !target.closest(".settings-popup") &&
          !target.closest(".settings-btn")
        ) {
          setShowSettings(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettings]);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Handle scroll only for top button visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollTop = window.scrollY;

      // Show top button only when user has scrolled down a bit
      setIsTopButtonVisible(currentScrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle keyboard navigation in horizontal mode
  useEffect(() => {
    if (layout === "horizontal") {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowRight") {
          setCurrentPage((prev) => Math.min(prev + 1, getMangaImages().length));
        } else if (e.key === "ArrowLeft") {
          setCurrentPage((prev) => Math.max(prev - 1, 1));
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [layout, data]);

  // Loading state
  if (isLoading) {
    return (
      <ReaderLayout
        contentId={contentId}
        chapterId={0}
        contentType="manga"
        title=""
        chapterTitle=""
        chapterNumber={chapterNumber}
        prevChapterId={undefined}
        nextChapterId={undefined}
        onChapterListToggle={handleChapterListToggle}
      >
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Đang tải nội dung...</p>
          </div>
        </div>
      </ReaderLayout>
    );
  }

  // Error state
  if (isError || !data) {
    return (
      <ReaderLayout
        contentId={contentId}
        chapterId={0}
        contentType="manga"
        title=""
        chapterTitle=""
        chapterNumber={chapterNumber}
        prevChapterId={undefined}
        nextChapterId={undefined}
        onChapterListToggle={handleChapterListToggle}
      >
        <Alert className="max-w-3xl mx-auto mt-8" variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Lỗi tải nội dung</AlertTitle>
          <AlertDescription>
            Không thể tải nội dung chương. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      </ReaderLayout>
    );
  }

  // If chapter not found
  if (!data.chapter) {
    return (
      <ReaderLayout
        contentId={contentId}
        chapterId={0}
        contentType="manga"
        title={mangaTitle}
        chapterTitle=""
        chapterNumber={chapterNumber}
        prevChapterId={undefined}
        nextChapterId={undefined}
        onChapterListToggle={handleChapterListToggle}
      >
        <Alert className="max-w-3xl mx-auto mt-8">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Chương không tồn tại</AlertTitle>
          <AlertDescription>
            Chương bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </AlertDescription>
        </Alert>
      </ReaderLayout>
    );
  }

  // If chapter is locked and not unlocked
  if (data.chapter.isLocked && !data.chapter.isUnlocked) {
    return (
      <ReaderLayout
        contentId={contentId}
        chapterId={data.chapter.id}
        contentType="manga"
        title={mangaTitle}
        chapterTitle={data.chapter.title || `Chương ${data.chapter.number}`}
        chapterNumber={data.chapter.number}
        prevChapterId={data.navigation?.prevChapter?.id}
        nextChapterId={data.navigation?.nextChapter?.id}
        onChapterListToggle={handleChapterListToggle}
      >
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="p-8 max-w-md mx-auto bg-background/80 backdrop-blur-sm rounded-lg shadow">
            <LockIcon className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Chương này đã bị khóa</h2>
            <p className="mt-4 text-muted-foreground">
              Bạn cần mở khóa chương này để đọc nội dung.
            </p>
            <div className="mt-6">
              <Button onClick={() => setShowUnlockModal(true)}>
                Mở khóa với {data.chapter.unlockPrice} xu
              </Button>
            </div>
          </div>
        </div>

        {/* Unlock modal */}
        <UnlockModal
          isOpen={showUnlockModal}
          onClose={() => setShowUnlockModal(false)}
          chapter={data.chapter}
          onUnlockSuccess={handleUnlockConfirm}
        />

        {/* Chapter List Side Sheet */}
        <ChapterListSidebar
          showChapterList={showChapterList}
          setShowChapterList={setShowChapterList}
          searchChapter={searchChapter}
          setSearchChapter={setSearchChapter}
          getSortedChapters={getSortedChapters}
          currentChapterId={data.chapter.id}
          contentId={contentId}
        />
      </ReaderLayout>
    );
  }

  // Extract manga images
  const mangaImages = getMangaImages();

  // No images found
  if (mangaImages.length === 0) {
    return (
      <ReaderLayout
        contentId={contentId}
        chapterId={data.chapter.id}
        contentType="manga"
        title={mangaTitle}
        chapterTitle={data.chapter.title || `Chương ${data.chapter.number}`}
        chapterNumber={data.chapter.number}
        prevChapterId={data.navigation?.prevChapter?.id}
        nextChapterId={data.navigation?.nextChapter?.id}
        onChapterListToggle={handleChapterListToggle}
      >
        <Alert className="max-w-3xl mx-auto mt-8">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Không tìm thấy hình ảnh</AlertTitle>
          <AlertDescription>
            Chương này không có hình ảnh hoặc có lỗi định dạng.
          </AlertDescription>
        </Alert>

        {/* Chapter List Side Sheet */}
        <ChapterListSidebar
          showChapterList={showChapterList}
          setShowChapterList={setShowChapterList}
          searchChapter={searchChapter}
          setSearchChapter={setSearchChapter}
          getSortedChapters={getSortedChapters}
          currentChapterId={data.chapter.id}
          contentId={contentId}
        />
      </ReaderLayout>
    );
  }

  // Render manga content based on layout mode
  const renderMangaContent = () => {
    if (layout === "vertical") {
      return (
        <div className="manga-reader space-y-6 mx-auto">
          {mangaImages.map((imageUrl, index) => (
            <div key={index} className="relative">
              <div className="flex items-center justify-center">
                <div
                  className={`relative ${viewMode === "fit" ? "max-w-4xl w-full" : "w-auto"}`}
                >
                  {!imgLoadStatus.get(index) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  <img
                    ref={getImageRef(index)}
                    data-index={index}
                    src={imageUrl}
                    alt={`Trang ${index + 1}`}
                    className={`mx-auto shadow-md rounded-md transition-opacity duration-300 ${
                      !imgLoadStatus.get(index) ? "opacity-40" : "opacity-100"
                    }`}
                    style={{
                      width: viewMode === "original" ? "auto" : "100%",
                      maxWidth: viewMode === "width-fit" ? "100%" : "none",
                      objectFit: "contain",
                    }}
                    loading="lazy"
                    onLoad={() => handleImageLoad(index)}
                    onError={() => handleImageError(index)}
                  />
                  {/* Không hiển thị số trang trong chế độ cuộn dọc để tối ưu trải nghiệm đọc */}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    } else if (layout === "horizontal") {
      return (
        <div className="manga-reader relative flex flex-col items-center justify-center min-h-[70vh]">
          <div className="relative h-[75vh] flex items-center justify-center w-full">
            {!imgLoadStatus.get(currentPage - 1) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            )}
            <img
              ref={getImageRef(currentPage - 1)}
              data-index={currentPage - 1}
              src={mangaImages[currentPage - 1]}
              alt={`Trang ${currentPage}`}
              className={`rounded-md shadow-md transition-opacity duration-300 ${
                !imgLoadStatus.get(currentPage - 1)
                  ? "opacity-40"
                  : "opacity-100"
              }`}
              style={{
                maxHeight: "75vh",
                maxWidth: "100%",
                objectFit: viewMode === "fit" ? "contain" : "none",
                width: viewMode === "width-fit" ? "100%" : "auto",
              }}
              onLoad={() => handleImageLoad(currentPage - 1)}
              onError={() => handleImageError(currentPage - 1)}
            />
          </div>

          <div className="flex items-center justify-between w-full max-w-lg mt-6 px-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Trang trước
            </Button>

            <div className="text-center flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={mangaImages.length}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= mangaImages.length) {
                    setCurrentPage(val);
                  }
                }}
                className="w-16 text-center"
              />
              <span>/</span>
              <span>{mangaImages.length}</span>
            </div>

            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, mangaImages.length))
              }
              disabled={currentPage === mangaImages.length}
            >
              Trang sau
            </Button>
          </div>
        </div>
      );
    } else if (layout === "grid") {
      return (
        <div className="manga-reader grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          {mangaImages.map((imageUrl, index) => (
            <div
              key={index}
              className="relative"
              onClick={() => {
                setLayout("horizontal");
                setCurrentPage(index + 1);
              }}
            >
              {!imgLoadStatus.get(index) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/20 rounded-md">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              <img
                ref={getImageRef(index)}
                data-index={index}
                src={imageUrl}
                alt={`Trang ${index + 1}`}
                className={`w-full h-52 object-cover cursor-pointer rounded-md shadow-sm hover:shadow-md transition-all ${
                  !imgLoadStatus.get(index) ? "opacity-40" : "opacity-100"
                }`}
                loading="lazy"
                onLoad={() => handleImageLoad(index)}
                onError={() => handleImageError(index)}
              />
              {/* Số trang đã được ẩn để tối ưu trải nghiệm đọc */}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <ReaderLayout
      contentId={contentId}
      chapterId={data.chapter.id}
      contentType="manga"
      title={mangaTitle}
      chapterTitle={data.chapter.title || `Chương ${data.chapter.number}`}
      chapterNumber={data.chapter.number}
      prevChapterId={data.navigation?.prevChapter?.id}
      nextChapterId={data.navigation?.nextChapter?.id}
      onChapterListToggle={handleChapterListToggle}
    >
      {/* Simple chapter list button in header */}
      <div className="flex justify-end items-center mb-4 gap-2">
        {/* Settings button with popup */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-full h-9 w-9 p-0 flex items-center justify-center bg-gray-900/90 border-gray-700 settings-btn"
            title="Tùy chọn đọc"
          >
            <Settings className="h-4 w-4 text-gray-300" />
          </Button>

          {/* Settings popup */}
          {showSettings && (
            <div className="absolute right-0 top-10 z-50 w-[300px] bg-gray-900/95 border border-gray-700 rounded-lg shadow-lg p-4 settings-popup">
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2 text-white border-b border-gray-700 pb-2">
                  Kiểu xem:
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant={layout === "vertical" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLayout("vertical")}
                    className={`h-8 ${layout === "vertical" ? "bg-primary text-primary-foreground" : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"}`}
                    title="Cuộn dọc"
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span>Cuộn dọc</span>
                  </Button>
                  <Button
                    variant={layout === "horizontal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLayout("horizontal")}
                    className={`h-8 ${layout === "horizontal" ? "bg-primary text-primary-foreground" : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"}`}
                    title="Từng trang"
                  >
                    <Maximize2 className="h-4 w-4 mr-1" />
                    <span>Từng trang</span>
                  </Button>
                  <Button
                    variant={layout === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLayout("grid")}
                    className={`h-8 ${layout === "grid" ? "bg-primary text-primary-foreground" : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"}`}
                    title="Lưới ảnh"
                  >
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    <span>Lưới ảnh</span>
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 text-white border-b border-gray-700 pb-2">
                  Kích thước:
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant={viewMode === "fit" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("fit")}
                    className={`h-8 ${viewMode === "fit" ? "bg-primary text-primary-foreground" : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"}`}
                    title="Vừa màn hình"
                  >
                    <ZoomIn className="h-4 w-4 mr-1" />
                    <span>Vừa màn hình</span>
                  </Button>
                  <Button
                    variant={viewMode === "width-fit" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("width-fit")}
                    className={`h-8 ${viewMode === "width-fit" ? "bg-primary text-primary-foreground" : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"}`}
                    title="Vừa chiều rộng"
                  >
                    <ZoomOut className="h-4 w-4 mr-1" />
                    <span>Vừa chiều rộng</span>
                  </Button>
                  <Button
                    variant={viewMode === "original" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("original")}
                    className={`h-8 ${viewMode === "original" ? "bg-primary text-primary-foreground" : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"}`}
                    title="Kích thước gốc"
                  >
                    <Maximize2 className="h-4 w-4 mr-1" />
                    <span>Kích thước gốc</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chapter list button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleChapterListToggle}
          className="rounded-full h-9 w-9 p-0 flex items-center justify-center bg-gray-900/90 border-gray-700"
          title="Mục lục"
        >
          <BookOpen className="h-4 w-4 text-gray-300" />
        </Button>
      </div>

      {/* Scroll to top button */}
      <Button
        variant="secondary"
        size="icon"
        className={`fixed bottom-6 right-6 z-50 rounded-full h-12 w-12 shadow-lg transition-all duration-300 ${
          isTopButtonVisible
            ? "opacity-80 translate-y-0 hover:opacity-100"
            : "opacity-0 translate-y-16 pointer-events-none"
        }`}
        onClick={scrollToTop}
        title="Lên đầu trang"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>

      {/* Manga content */}
      {renderMangaContent()}

      {/* Chapter navigation at bottom */}
      {/* <div className="flex items-center justify-between px-8 py-6 mt-8 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-md mb-4">
        <Button
          variant="outline"
          size="lg"
          disabled={!data.navigation?.prevChapter?.id}
          asChild
          className="text-gray-300 hover:text-white"
        >
          {data.navigation?.prevChapter?.id ? (
            <Link
              href={`/truyen/${contentId}/chapter/${data.navigation.prevChapter.number}`}
            >
              <ChevronRight className="h-5 w-5 mr-2 rotate-180" />
              Chương trước
            </Link>
          ) : (
            <span>
              <ChevronRight className="h-5 w-5 mr-2 rotate-180" />
              Chương trước
            </span>
          )}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={handleChapterListToggle}
          className="rounded-full h-12 w-12 p-0 flex items-center justify-center"
          title="Mục lục"
        >
          <BookOpen className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          disabled={!data.navigation?.nextChapter?.id}
          asChild
          className="text-gray-300 hover:text-white"
        >
          {data.navigation?.nextChapter?.id ? (
            <Link
              href={`/truyen/${contentId}/chapter/${data.navigation.nextChapter.number}`}
            >
              Chương tiếp
              <ChevronRight className="h-5 w-5 ml-2" />
            </Link>
          ) : (
            <span>
              Chương tiếp
              <ChevronRight className="h-5 w-5 ml-2" />
            </span>
          )}
        </Button>
      </div> */}

      {/* Chapter List Side Sheet */}
      <ChapterListSidebar
        showChapterList={showChapterList}
        setShowChapterList={setShowChapterList}
        searchChapter={searchChapter}
        setSearchChapter={setSearchChapter}
        getSortedChapters={getSortedChapters}
        currentChapterId={data.chapter.id}
        contentId={contentId}
      />
    </ReaderLayout>
  );
}

// Separated chapter list sidebar component for cleaner code
function ChapterListSidebar({
  showChapterList,
  setShowChapterList,
  searchChapter,
  setSearchChapter,
  getSortedChapters,
  currentChapterId,
  contentId,
}: {
  showChapterList: boolean;
  setShowChapterList: (show: boolean) => void;
  searchChapter: string;
  setSearchChapter: (search: string) => void;
  getSortedChapters: () => any[];
  currentChapterId: number;
  contentId: number;
}) {
  // Filter chapters based on search
  const filteredChapters = getSortedChapters().filter(
    (ch) =>
      searchChapter === "" ||
      (ch.title &&
        ch.title.toLowerCase().includes(searchChapter.toLowerCase())) ||
      `chương ${ch.number}`.toLowerCase().includes(searchChapter.toLowerCase()),
  );

  // Check if there are no matching chapters
  const noResults = filteredChapters.length === 0;

  return (
    <Sheet open={showChapterList} onOpenChange={setShowChapterList}>
      <SheetContent
        side="right"
        className="w-[300px] sm:w-[350px] md:w-[400px] bg-gray-900 border-l-gray-800"
      >
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              Danh sách chương
            </h3>
            {/* <Button variant="ghost" size="sm" onClick={() => setShowChapterList(false)} className="text-gray-400 hover:text-white hover:bg-gray-800">
              <X className="h-4 w-4" />
            </Button> */}
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm chương..."
                className="pl-8 bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus-visible:ring-gray-700"
                value={searchChapter}
                onChange={(e) => setSearchChapter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto">
            {!noResults ? (
              filteredChapters.map((ch) => (
                <div key={ch.id} className="py-1 border-b border-gray-800">
                  <Link
                    href={`/truyen/${contentId}/chapter/${ch.number}`}
                    className={`block py-2 px-3 rounded-md hover:bg-gray-800 transition-colors duration-200 ${
                      ch.id === currentChapterId
                        ? "bg-primary/10 text-primary font-medium border-l-4 border-primary pl-2"
                        : "text-gray-300"
                    }`}
                    onClick={() => setShowChapterList(false)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {ch.id === currentChapterId && (
                          <ChevronRight className="h-3 w-3 mr-1 text-primary" />
                        )}
                        <span>Chương {ch.number}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {ch.views > 0 && (
                          <EyeIcon className="h-3 w-3 text-gray-500" />
                        )}
                        {/* Hiển thị biểu tượng khóa cho chương chưa mở khóa */}
                        {ch.isLocked && !ch.isUnlocked && (
                          <div className="flex items-center">
                            <LockIcon className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-amber-500 ml-1">{ch.unlockPrice} xu</span>
                          </div>
                        )}
                        {/* Hiển thị biểu tượng mở khóa cho chương đã mở khóa */}
                        {ch.isLocked && ch.isUnlocked && (
                          <div className="flex items-center">
                            <Check className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-500 ml-1">Đã mở khóa</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {ch.title && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {ch.title}
                      </div>
                    )}
                  </Link>
                </div>
              ))
            ) : (
              // Empty state design from screenshot
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-gray-800 p-6 mb-4">
                  <SearchX className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-gray-400 font-medium">
                  Không tìm thấy chương phù hợp
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function DefaultMangaReaderPage() {
  const [_, params] = useRoute<{ contentId: string; chapterNumber: string }>(
    "/truyen/:contentId/chapter/:chapterNumber",
  );

  if (!params) return null;

  const contentId = parseInt(params.contentId, 10);
  const chapterNumber = parseInt(params.chapterNumber, 10);

  if (isNaN(contentId) || isNaN(chapterNumber)) {
    return <div>Invalid manga chapter URL</div>;
  }

  return (
    <MangaReaderPage contentId={contentId} chapterNumber={chapterNumber} />
  );
}
