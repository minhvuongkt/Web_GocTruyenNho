import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import MangaReaderPage from "./manga-reader-page";
import NovelReaderPage from "./novel-reader-page";
import { normalizeId } from "@/lib/hashUtils";

interface ChapterReaderPageProps {
  contentId?: string | number;
  contentTitle?: string;
  chapterId?: string | number;
  chapterNumber?: number;
  usingChapterNumber?: boolean;
  usingTitle?: boolean;
}

export function ChapterReaderPage({ 
  contentId, 
  contentTitle,
  chapterId, 
  chapterNumber, 
  usingChapterNumber = false,
  usingTitle = false
}: ChapterReaderPageProps) {
  // Content ID state - will be loaded from API if using title
  const [normalizedContentId, setNormalizedContentId] = useState<number | null>(
    contentId ? normalizeId(contentId) : null
  );
  
  // State for the actual chapter ID (will be resolved if using chapter number)
  const [resolvedChapterId, setResolvedChapterId] = useState<number | null>(
    usingChapterNumber || usingTitle ? null : (chapterId ? normalizeId(chapterId) : null)
  );
  
  // Fetch content by title if needed
  const { data: contentByTitleData, isLoading: isLoadingContentByTitle, isError: isErrorContentByTitle } = useQuery({
    queryKey: [`/api/content/by-title/${contentTitle}`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/content/by-title/${contentTitle}`);
        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Error fetching content by title:", error);
        return null;
      }
    },
    enabled: usingTitle && !!contentTitle
  });
  
  // Fetch content type to determine which component to render
  const { data: contentData, isLoading: isLoadingContent, isError: isErrorContent } = useQuery({
    queryKey: [`/api/content/${normalizedContentId}/type`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/content/${normalizedContentId}`);
        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Error fetching content:", error);
        return null;
      }
    },
    enabled: !!normalizedContentId && !usingTitle
  });
  
  // Effect to set normalizedContentId from title lookup
  useEffect(() => {
    if (usingTitle && contentByTitleData && contentByTitleData.content) {
      setNormalizedContentId(contentByTitleData.content.id);
    }
  }, [usingTitle, contentByTitleData]);

  // Fetch chapter by title and number using the dedicated API
  const { data: chapterByTitleData, isLoading: isLoadingChapterByTitle } = useQuery({
    queryKey: [`/api/content/by-title/${contentTitle}/chapter/${chapterNumber}`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/content/by-title/${contentTitle}/chapter/${chapterNumber}`);
        return res.json();
      } catch (error) {
        console.error("Error fetching chapter by title and number:", error);
        return null;
      }
    },
    enabled: usingTitle && !!contentTitle && !!chapterNumber,
  });
  
  // If using chapter number, fetch the chapter ID based on number
  const { data: chaptersData, isLoading: isLoadingChapters } = useQuery({
    queryKey: [`/api/content/${normalizedContentId}/chapters`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/content/${normalizedContentId}/chapters`);
        return res.json();
      } catch (error) {
        console.error("Error fetching chapters:", error);
        return [];
      }
    },
    enabled: usingChapterNumber && !!normalizedContentId && !usingTitle,
  });

  // Fetch chapter by number using the API
  const { data: chapterByNumberData, isLoading: isLoadingChapterByNumber } = useQuery({
    queryKey: [`/api/content/${normalizedContentId}/chapter-by-number/${chapterNumber}`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/content/${normalizedContentId}/chapter-by-number/${chapterNumber}`);
        return res.json();
      } catch (error) {
        console.error("Error fetching chapter by number:", error);
        return null;
      }
    },
    enabled: usingChapterNumber && !!normalizedContentId && !!chapterNumber && !usingTitle,
  });

  // Effect to find the chapter ID based on chapter number or title
  useEffect(() => {
    if (usingTitle && chapterByTitleData) {
      // For title-based lookup, we get both content and chapter info
      if (chapterByTitleData.content && chapterByTitleData.chapter) {
        setNormalizedContentId(chapterByTitleData.content.id);
        setResolvedChapterId(chapterByTitleData.chapter.id);
      }
    } else if (usingChapterNumber) {
      if (chapterByNumberData && chapterByNumberData.chapter) {
        // Use the chapter found directly from the API
        setResolvedChapterId(chapterByNumberData.chapter.id);
      } else if (chaptersData && chapterNumber) {
        // Fallback to the old approach if the new API fails
        const chapter = chaptersData.find((chapter: any) => chapter.number === chapterNumber);
        if (chapter) {
          setResolvedChapterId(chapter.id);
        }
      }
    }
  }, [usingChapterNumber, usingTitle, chaptersData, chapterNumber, chapterByNumberData, chapterByTitleData]);

  // Loading state for all possible loading scenarios
  if (
    isLoadingContent || 
    isLoadingContentByTitle || 
    (usingChapterNumber && (isLoadingChapters || isLoadingChapterByNumber)) ||
    (usingTitle && isLoadingChapterByTitle)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải...</span>
      </div>
    );
  }

  // Handle title-based routing with direct data from API
  if (usingTitle) {
    if (isErrorContentByTitle || !contentByTitleData || !contentByTitleData.content) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Không tìm thấy nội dung</h2>
            <p className="text-muted-foreground">
              Nội dung "{contentTitle}" không tồn tại hoặc đã bị xóa.
            </p>
          </div>
        </div>
      );
    }

    if (!resolvedChapterId) {
      // If we're viewing the title-based route but don't have the chapter data yet
      if (chapterByTitleData && !chapterByTitleData.chapter) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Không tìm thấy chương</h2>
              <p className="text-muted-foreground">
                Chương số {chapterNumber} không tồn tại cho truyện "{contentTitle}".
              </p>
            </div>
          </div>
        );
      }
      
      // Still waiting for chapter data
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Đang tải dữ liệu chương...</span>
        </div>
      );
    }

    // We have all data for title-based routing
    const contentType = contentByTitleData.content.type;
    
    // Render the appropriate component based on content type
    if (contentType === "manga") {
      return <MangaReaderPage contentId={normalizedContentId} chapterId={resolvedChapterId} />;
    } else if (contentType === "novel") {
      return <NovelReaderPage contentId={normalizedContentId} chapterId={resolvedChapterId} />;
    }
  }
  
  // Handle ID-based routing (legacy path)
  
  // Error handling for content data
  if (isErrorContent || !contentData || !contentData.content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Không tìm thấy nội dung</h2>
          <p className="text-muted-foreground">
            Nội dung bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
        </div>
      </div>
    );
  }

  // Error handling for chapter number not found
  if (usingChapterNumber && !resolvedChapterId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Không tìm thấy chương</h2>
          <p className="text-muted-foreground">
            Chương số {chapterNumber} không tồn tại cho nội dung này.
          </p>
        </div>
      </div>
    );
  }

  // Get the content type
  const contentType = contentData.content.type;
  const actualChapterId = resolvedChapterId || (chapterId ? normalizeId(chapterId) : null);

  // Make sure we have a chapter ID
  if (!actualChapterId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Không tìm thấy thông tin chương</h2>
          <p className="text-muted-foreground">
            Không thể xác định chương để hiển thị.
          </p>
        </div>
      </div>
    );
  }

  // Render the appropriate component based on content type
  if (contentType === "manga") {
    return <MangaReaderPage contentId={normalizedContentId} chapterId={actualChapterId} />;
  } else if (contentType === "novel") {
    return <NovelReaderPage contentId={normalizedContentId} chapterId={actualChapterId} />;
  } else {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loại nội dung không hỗ trợ</h2>
          <p className="text-muted-foreground">
            Loại nội dung này hiện không được hỗ trợ.
          </p>
        </div>
      </div>
    );
  }
}

export default ChapterReaderPage;