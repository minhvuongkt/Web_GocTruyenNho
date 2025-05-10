import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Unlock } from "lucide-react";

interface UnlockedChaptersListProps {
  contentId: number;
}

export function UnlockedChaptersList({ contentId }: UnlockedChaptersListProps) {
  const { user } = useAuth();
  
  // Fetch unlocked chapters for this content
  const { data: unlockedChapterIds, isLoading, error } = useQuery({
    queryKey: [`/api/user/unlocked-chapters/${contentId}`],
    enabled: !!user && !!contentId,
  });
  
  // Fetch all chapters for this content to get their details
  const { data: chapters } = useQuery({
    queryKey: [`/api/content/${contentId}/chapters`],
    enabled: !!contentId,
  });
  
  // If user is not logged in
  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Đăng nhập để xem các chương bạn đã mở khóa.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-destructive">
            Không thể tải danh sách chương đã mở khóa.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // No unlocked chapters
  if (!unlockedChapterIds || unlockedChapterIds.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Unlock size={16} />
            <p className="text-sm">Bạn chưa mở khóa chương nào.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Filter chapters to only show unlocked ones
  const unlockedChapters = chapters?.filter((chapter: any) => 
    unlockedChapterIds.includes(chapter.id)
  ) || [];
  
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Unlock size={16} className="text-primary" />
          Chương đã mở khóa ({unlockedChapterIds.length})
        </h3>
        
        <div className="flex flex-wrap gap-2">
          {unlockedChapters.map((chapter: any) => (
            <Badge key={chapter.id} variant="outline" className="hover:bg-primary/10">
              <Link href={`/truyen/${contentId}/chuong/${chapter.number}`}>
                Chương {chapter.number}
              </Link>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}