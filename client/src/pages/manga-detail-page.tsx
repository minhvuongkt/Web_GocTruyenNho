import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Content, Genre, Chapter, Author, TranslationGroup } from "@shared/schema";
import { MainLayout } from "@/components/layouts/main-layout";
import { ChapterList } from "@/components/shared/chapter-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  BookOpen, 
  Heart, 
  Share2, 
  MessageSquare, 
  Calendar, 
  User, 
  Users, 
  Tag,
  Bookmark,
  BookmarkCheck,
  Clock
} from "lucide-react";
import { formatDate, getRandomCoverImage, getStatusLabel } from "@/lib/utils";

interface MangaDetailPageProps {
  id: number;
}

interface ContentDetails {
  content: Content;
  genres?: Genre[];
  author?: Author;
  translationGroup?: TranslationGroup;
  chapters?: Chapter[];
}

export function MangaDetailPage({ id }: MangaDetailPageProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState("chapters");
  
  // Fetch manga details
  const { data, isLoading, isError } = useQuery<ContentDetails>({
    queryKey: [`/api/content/${id}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/content/${id}`);
      return res.json();
    }
  });
  
  // Fetch comments
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: [`/api/content/${id}/comments`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/content/${id}/comments`);
      return res.json();
    }
  });
  
  // Check if manga is in user's favorites
  const { data: favorites } = useQuery({
    queryKey: ["/api/favorites"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/favorites");
      return res.json();
    },
    enabled: !!user
  });
  
  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/favorites/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    }
  });
  
  // Get user unlocked chapters
  const { data: unlockedChapters } = useQuery({
    queryKey: [`/api/user/unlocked-chapters/${id}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/user/unlocked-chapters/${id}`);
      return res.json();
    },
    enabled: !!user
  });
  
  // Submit comment mutation
  const commentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/comments", {
        contentId: id,
        text: comment
      });
      return res.json();
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/content/${id}/comments`] });
    }
  });
  
  // Check if content is in favorites
  const isFavorite = favorites?.some((fav: Content) => fav.id === id);
  
  // Handle favorite toggle
  const handleToggleFavorite = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    toggleFavoriteMutation.mutate();
  };
  
  // Handle comment submission
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;
    commentMutation.mutate();
  };
  
  // If loading, show skeleton
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3 lg:w-1/4">
              <div className="bg-muted animate-pulse h-96 w-full rounded-lg"></div>
            </div>
            <div className="md:w-2/3 lg:w-3/4 space-y-4">
              <div className="h-10 bg-muted animate-pulse rounded-md w-3/4"></div>
              <div className="h-6 bg-muted animate-pulse rounded-md w-1/2"></div>
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-6 bg-muted animate-pulse rounded-full w-16"></div>
                ))}
              </div>
              <div className="space-y-2 pt-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-4 bg-muted animate-pulse rounded-md w-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // If error, show error message
  if (isError) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Không thể tải thông tin truyện</h2>
          <p className="text-muted-foreground mb-6">Đã xảy ra lỗi khi tải thông tin truyện. Vui lòng thử lại sau.</p>
          <Button asChild>
            <Link href="/">Quay lại trang chủ</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  // Extract data
  const { content, genres, author, translationGroup, chapters } = data || {};
  const coverImage = content?.coverImage || getRandomCoverImage('manga');
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Manga details */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover image */}
          <div className="md:w-1/3 lg:w-1/4">
            <div className="aspect-[3/4] overflow-hidden rounded-lg shadow-md relative">
              <img 
                src={coverImage}
                alt={content?.title} 
                className="w-full h-full object-cover"
              />
              {content?.status && (
                <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground">
                  {getStatusLabel(content.status)}
                </Badge>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-4">
              {chapters && chapters.length > 0 && (
                <>
                  <Button asChild>
                    <Link href={`/manga/${id}/chapter/${chapters[0].id}`}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Đọc từ đầu
                    </Link>
                  </Button>
                  
                  {chapters.length > 1 && (
                    <Button variant="outline" asChild>
                      <Link href={`/manga/${id}/chapter/${chapters[chapters.length - 1].id}`}>
                        <Clock className="mr-2 h-4 w-4" />
                        Đọc chương mới nhất
                      </Link>
                    </Button>
                  )}
                </>
              )}
              
              <Button 
                variant={isFavorite ? "secondary" : "outline"} 
                onClick={handleToggleFavorite}
                disabled={toggleFavoriteMutation.isPending}
              >
                {isFavorite ? (
                  <>
                    <BookmarkCheck className="mr-2 h-4 w-4" />
                    Đã thêm vào yêu thích
                  </>
                ) : (
                  <>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Thêm vào yêu thích
                  </>
                )}
              </Button>
              
              <Button variant="ghost">
                <Share2 className="mr-2 h-4 w-4" />
                Chia sẻ
              </Button>
            </div>
          </div>
          
          {/* Details */}
          <div className="md:w-2/3 lg:w-3/4">
            <h1 className="text-3xl font-bold">{content?.title}</h1>
            {content?.alternativeTitle && (
              <h2 className="text-lg text-muted-foreground mt-1">{content.alternativeTitle}</h2>
            )}
            
            {/* Genres */}
            {genres && genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {genres.map(genre => (
                  <Badge key={genre.id} variant="secondary">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">Tác giả:</span>
                <span className="ml-2">{author?.name || "Không rõ"}</span>
              </div>
              
              {translationGroup && (
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Nhóm dịch:</span>
                  <span className="ml-2">{translationGroup.name}</span>
                </div>
              )}
              
              {content?.releaseYear && (
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Năm phát hành:</span>
                  <span className="ml-2">{content.releaseYear}</span>
                </div>
              )}
              
              {content?.views !== undefined && (
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Lượt xem:</span>
                  <span className="ml-2">{content.views.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            {/* Description */}
            {content?.description && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Giới thiệu</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {content.description}
                </p>
              </div>
            )}
            
            {/* Tabs: Chapters & Comments */}
            <Tabs 
              defaultValue="chapters" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="mt-8"
            >
              <TabsList>
                <TabsTrigger value="chapters" className="flex items-center">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Danh sách chương
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Bình luận
                </TabsTrigger>
              </TabsList>
              
              {/* Chapters tab */}
              <TabsContent value="chapters">
                {chapters && chapters.length > 0 ? (
                  <ChapterList 
                    chapters={chapters} 
                    contentId={id} 
                    contentType="manga"
                    userUnlockedChapters={unlockedChapters}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có chương nào được thêm vào.
                  </div>
                )}
              </TabsContent>
              
              {/* Comments tab */}
              <TabsContent value="comments">
                <div className="space-y-6">
                  {/* Comment form */}
                  {user ? (
                    <form onSubmit={handleSubmitComment} className="space-y-4">
                      <Textarea
                        placeholder="Viết bình luận của bạn..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <Button 
                        type="submit" 
                        disabled={!comment.trim() || commentMutation.isPending}
                      >
                        {commentMutation.isPending ? "Đang gửi..." : "Gửi bình luận"}
                      </Button>
                    </form>
                  ) : (
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="mb-3 text-muted-foreground">
                        Đăng nhập để bình luận về truyện này.
                      </p>
                      <Button asChild>
                        <Link href="/auth">Đăng nhập</Link>
                      </Button>
                    </div>
                  )}
                  
                  {/* Comment list */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Bình luận ({comments?.length || 0})
                    </h3>
                    
                    {isLoadingComments ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                              <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
                              <div className="h-16 bg-muted animate-pulse rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : comments && comments.length > 0 ? (
                      <div className="space-y-6">
                        {comments.map((comment: any) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {comment.user?.username.substring(0, 2).toUpperCase() || "??"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-baseline justify-between">
                                <h4 className="font-medium">
                                  {comment.user?.username || "Người dùng không xác định"}
                                </h4>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="mt-2 text-foreground/90 whitespace-pre-line">
                                {comment.text}
                              </p>
                              <div className="mt-2 flex gap-4">
                                <Button variant="ghost" size="sm">
                                  Trả lời
                                </Button>
                                <Button variant="ghost" size="sm">
                                  Báo cáo
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default MangaDetailPage;
