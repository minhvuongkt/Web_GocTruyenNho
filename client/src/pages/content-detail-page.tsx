import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Content } from "@shared/schema";
import { 
  Loader2, 
  BookOpen, 
  Image, 
  Calendar, 
  Eye, 
  Star, 
  User, 
  Tag, 
  Lock, 
  Clock, 
  ChevronRight 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

interface ContentDetailPageProps {
  id: string | number;
}

export function ContentDetailPage({ id }: ContentDetailPageProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("chapters");
  
  // Normalize the ID to a number
  const contentId = typeof id === "number" ? id : parseInt(id, 10);

  // Fetch the content details
  const { data: contentData, isLoading, error } = useQuery({
    queryKey: [`/api/content/${contentId}`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/content/${contentId}`);
        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Error fetching content:", error);
        return null;
      }
    }
  });

  // Fetch chapters for this content
  const { data: chaptersData, isLoading: chaptersLoading } = useQuery({
    queryKey: [`/api/chapters/content/${contentId}`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/chapters/content/${contentId}`);
        const data = await res.json();
        return data.chapters || [];
      } catch (error) {
        console.error("Error fetching chapters:", error);
        return [];
      }
    },
    enabled: !!contentId
  });

  // Helper function to get sorted chapters
  const getSortedChapters = () => {
    if (!chaptersData) return [];
    return [...chaptersData].sort((a, b) => b.number - a.number);
  };

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
  if (error || !contentData) {
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

  // Get content data
  const content = contentData.content || contentData;
  const contentType = content.type;

  // Handle reading the latest chapter
  const handleReadLatest = () => {
    const sortedChapters = getSortedChapters();
    if (sortedChapters.length > 0) {
      const latestChapter = sortedChapters[sortedChapters.length - 1];
      setLocation(`/truyen/${contentId}/chapter-${latestChapter.number}`);
    } else {
      toast({
        title: "Không có chương nào",
        description: "Truyện này chưa có chương nào để đọc.",
        variant: "destructive"
      });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Content Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Cover image */}
        <div className="md:col-span-1">
          <div className="rounded-md overflow-hidden shadow-md bg-card aspect-[3/4] w-full max-w-sm mx-auto">
            <img 
              src={content.coverUrl || '/placeholder-cover.jpg'} 
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Content info */}
        <div className="md:col-span-2 flex flex-col">
          <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
          {content.alternativeTitles && (
            <p className="text-muted-foreground mb-4">
              {content.alternativeTitles}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2 mb-4">
            {content.status && (
              <Badge variant="outline" className="capitalize">
                {content.status === 'ongoing' ? 'Đang tiến hành' : 
                 content.status === 'completed' ? 'Hoàn thành' : 
                 content.status === 'hiatus' ? 'Tạm ngưng' : content.status}
              </Badge>
            )}
            {contentType && (
              <Badge variant="secondary" className="capitalize">
                {contentType === 'manga' ? 'Truyện tranh' : 'Tiểu thuyết'}
              </Badge>
            )}
            {content.ageRating && (
              <Badge variant={content.ageRating === '18+' ? 'destructive' : 'default'}>
                {content.ageRating}
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Cập nhật: {formatDate(content.updatedAt || content.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span>{content.views || 0} lượt xem</span>
            </div>
            {content.author && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Tác giả: {content.author}</span>
              </div>
            )}
            {chaptersData && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>{chaptersData.length} chương</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 my-2">
            {content.genres && content.genres.map((genre, index) => (
              <Badge key={index} variant="outline" className="hover:bg-primary/10">
                {genre}
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-3 mt-auto pt-4">
            <Button onClick={handleReadLatest} className="flex-1 sm:flex-none">
              Đọc ngay
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Star className="mr-2 h-4 w-4" /> Yêu thích
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content Details */}
      <Tabs defaultValue="chapters" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-6">
          <TabsTrigger value="chapters">Danh sách chương</TabsTrigger>
          <TabsTrigger value="details">Chi tiết</TabsTrigger>
          <TabsTrigger value="comments">Bình luận</TabsTrigger>
        </TabsList>
        
        {/* Chapters tab */}
        <TabsContent value="chapters" className="mt-0">
          <Card>
            <CardContent className="p-0">
              {chaptersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Đang tải danh sách chương...</span>
                </div>
              ) : getSortedChapters().length > 0 ? (
                <div className="divide-y">
                  {getSortedChapters().map((chapter) => (
                    <Link
                      key={chapter.id}
                      href={`/truyen/${contentId}/chapter-${chapter.number}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {contentType === 'manga' ? (
                            <Image className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            Chương {chapter.number}
                            {chapter.title && `: ${chapter.title}`}
                          </span>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(chapter.releaseDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {chapter.views || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {chapter.isLocked && (
                          <Lock className="h-4 w-4 text-muted-foreground mr-2" />
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">Chưa có chương nào.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Details tab */}
        <TabsContent value="details">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Giới thiệu</h3>
              <div className="prose max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: content.description || 'Không có mô tả.' }}
              />
              
              <div className="mt-8 space-y-4">
                {content.translationGroup && (
                  <div>
                    <h4 className="font-medium mb-2">Nhóm dịch</h4>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{content.translationGroup.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span>{content.translationGroup}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Comments tab */}
        <TabsContent value="comments">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Bình luận</h3>
              <p className="text-muted-foreground text-center p-6">
                Tính năng bình luận sẽ được cập nhật trong thời gian tới.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ContentDetailPage;
