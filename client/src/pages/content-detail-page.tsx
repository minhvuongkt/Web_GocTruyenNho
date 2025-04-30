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
  const isTitle = typeof id === 'string' && /[a-zA-Z\-]/.test(id) && id.includes('-');
  
  // Store the content ID once retrieved (for use in child components)
  const [contentIdForChildren, setContentIdForChildren] = useState<number | null>(null);
  
  // Normalize the ID (convert from hash if needed) if it's not a title
  let normalizedId: string | number = id;
  
  // Chỉ áp dụng normalizeId cho trường hợp không phải tiêu đề và có thể chuyển thành số
  if (!isTitle && typeof id === 'string') {
    // Kiểm tra xem id có phải là chuỗi số không
    if (/^\d+$/.test(id)) {
      normalizedId = normalizeId(id);
    }
  } else if (typeof id === 'number') {
    normalizedId = id;
  }
  
  // Fetch content data - this will determine which component to render
  const { data: contentData, isLoading, isError } = useQuery({
    queryKey: [isTitle ? `/api/content/by-title/${normalizedId}` : `/api/content/${normalizedId}`],
    queryFn: async () => {
      try {
        let endpoint;
        
        if (isTitle) {
          // Khi normalizedId có dạng "ten-truyen", API cần nhận "ten-truyen"
          endpoint = `/api/content/by-title/${normalizedId}`;
        } else {
          endpoint = `/api/content/${normalizedId}`;
        }
        
        console.log("Content: Fetching from endpoint:", endpoint);
        const res = await apiRequest("GET", endpoint);
        const data = await res.json();
        console.log("Content: Response data:", data);
        
        return data; // Trả về toàn bộ dữ liệu
      } catch (error) {
        console.error("Error fetching content:", error);
        return null;
      }
    }
  });

  // Khi có dữ liệu nội dung, lưu lại ID để sử dụng sau này
  useEffect(() => {
    if (contentData) {
      if (contentData.content && contentData.content.id) {
        // Nếu API trả về {content: {id: ...}}
        setContentIdForChildren(contentData.content.id);
      } else if (contentData.id) {
        // Nếu API trả về {id: ...}
        setContentIdForChildren(contentData.id);
      }
    }
  }, [contentData]);

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
  if (isError || !contentData) {
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

  // Xác định loại nội dung từ dữ liệu API
  const contentType = contentData.content?.type || contentData.type;

  if (!contentType) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Dữ liệu không đúng định dạng</h2>
          <p className="text-muted-foreground">
            Không thể xác định loại nội dung.
          </p>
        </div>
      </div>
    );
  }

  // Render the appropriate component based on content type
  if (contentType === "manga") {
    return <MangaDetailPage 
      id={contentIdForChildren || (typeof normalizedId === 'number' ? normalizedId : 0)} 
      titleUrl={isTitle ? String(normalizedId) : undefined}
    />;
  } else if (contentType === "novel") {
    return <NovelDetailPage 
      id={contentIdForChildren || (typeof normalizedId === 'number' ? normalizedId : 0)} 
      titleUrl={isTitle ? String(normalizedId) : undefined}
    />;
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