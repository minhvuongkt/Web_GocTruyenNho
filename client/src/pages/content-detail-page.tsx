import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Content } from "@shared/schema";
import { Loader2 } from "lucide-react";
import MangaDetailPage from "./manga-detail-page";
import NovelDetailPage from "./novel-detail-page";
import { normalizeId } from "@/lib/hashUtils";

interface ContentDetailPageProps {
  id: string | number;
}

export function ContentDetailPage({ id }: ContentDetailPageProps) {
  // Check if the ID is a title (contains hyphens and letters) or a numeric ID
  const isTitle = typeof id === 'string' && /[a-zA-Z]/.test(id) && id.includes('-');
  
  // Normalize the ID (convert from hash if needed) if it's not a title
  const normalizedId = isTitle ? id : normalizeId(id);
  
  // Fetch content type first to determine which component to render
  const { data, isLoading, isError } = useQuery({
    queryKey: [isTitle ? `/api/content/by-title/${normalizedId}` : `/api/content/${normalizedId}/type`],
    queryFn: async () => {
      try {
        const endpoint = isTitle 
          ? `/api/content/by-title/${normalizedId.replace(/-/g, ' ')}` 
          : `/api/content/${normalizedId}`;
        
        const res = await apiRequest("GET", endpoint);
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
            Truyện bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
        </div>
      </div>
    );
  }

  // Render the appropriate component based on content type
  if (data === "manga") {
    return <MangaDetailPage id={normalizedId} />;
  } else if (data === "novel") {
    return <NovelDetailPage id={normalizedId} />;
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

export default ContentDetailPage;