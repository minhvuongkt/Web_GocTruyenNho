import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import MangaReaderPage from "./manga-reader-page";
import NovelReaderPage from "./novel-reader-page";
import { normalizeId } from "@/lib/hashUtils";

interface ChapterReaderPageProps {
  contentId: string | number;
  chapterId?: string | number;
  chapterNumber?: number;
  usingChapterNumber?: boolean;
}

export function ChapterReaderPage({ 
  contentId, 
  chapterId, 
  chapterNumber, 
  usingChapterNumber = false 
}: ChapterReaderPageProps) {
  // Normalize content ID (convert from hashes if needed)
  const normalizedContentId = normalizeId(contentId);
  
  // State for the actual chapter ID (will be resolved if using chapter number)
  const [resolvedChapterId, setResolvedChapterId] = useState<number | null>(
    usingChapterNumber ? null : normalizeId(chapterId!)
  );
  
  // Fetch content type first to determine which component to render
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
    }
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
    enabled: usingChapterNumber && !!normalizedContentId,
  });

  // Fetch chapter by number using the new API
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
    enabled: usingChapterNumber && !!normalizedContentId && !!chapterNumber,
  });

  // Effect to find the chapter ID based on chapter number
  useEffect(() => {
    if (usingChapterNumber) {
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
  }, [usingChapterNumber, chaptersData, chapterNumber, chapterByNumberData]);

  // Loading state
  if (isLoadingContent || (usingChapterNumber && (isLoadingChapters || isLoadingChapterByNumber))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải...</span>
      </div>
    );
  }

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
  const actualChapterId = resolvedChapterId || normalizeId(chapterId!);

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