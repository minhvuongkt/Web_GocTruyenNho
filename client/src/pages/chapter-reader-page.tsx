import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import MangaReaderPage from "./manga-reader-page";
import NovelReaderPage from "./novel-reader-page";
import { normalizeId } from "@/lib/hashUtils";

interface ChapterReaderPageProps {
  contentId: number;
  chapterNumber: number;
}

export function ChapterReaderPage({ contentId, chapterNumber }: ChapterReaderPageProps) {
  // Use the IDs directly (not using hash anymore)
  const normalizedContentId = contentId;
  
  // Fetch content type first to determine which component to render
  const { data, isLoading, isError } = useQuery({
    queryKey: [`/api/content/${normalizedContentId}/type`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/content/${normalizedContentId}`);
        const data = await res.json();
        return data?.content?.type || null;
      } catch (error) {
        console.error("Error fetching content type:", error);
        return null;
      }
    }
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải...</span>
      </div>
    );
  }

  // Error handling
  if (isError || !data) {
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

  // Render the appropriate component based on content type
  if (data === "manga") {
    return <MangaReaderPage contentId={normalizedContentId} chapterNumber={chapterNumber} />;
  } else if (data === "novel") {
    return <NovelReaderPage contentId={normalizedContentId} chapterNumber={chapterNumber} />;
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