import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Pencil, 
  Trash2,
  Eye,
  Lock,
  Unlock,
  ArrowLeft,
  Upload,
  FileText,
  Image
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface ChapterManagementPageProps {
  contentId: number;
}

export function ChapterManagementPage({ contentId }: ChapterManagementPageProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState("chapters");
  
  // Fetch content details
  const { data: contentDetails, isLoading: loadingContent } = useQuery({
    queryKey: [`/api/content/${contentId}`],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // For now, we'll return mock data
      return {
        content: {
          id: contentId,
          title: contentId === 1 ? "Thám Tử Lừng Danh" : contentId === 2 ? "Hoa Anh Đào" : "Truyện #" + contentId,
          type: contentId % 2 === 0 ? "novel" : "manga",
          authorId: 1,
          authorName: "Tác giả A",
          status: "ongoing",
          views: 12345,
          releaseYear: 2020,
          description: "Mô tả nội dung truyện...",
          coverImage: "https://via.placeholder.com/300x400"
        },
        genres: [
          { id: 1, name: "Hành động" },
          { id: 2, name: "Phiêu lưu" }
        ],
        author: {
          id: 1,
          name: "Tác giả A"
        },
        chapters: [
          {
            id: 1,
            contentId: contentId,
            number: 1,
            title: "Khởi đầu",
            isLocked: false,
            unlockPrice: 0,
            views: 5000,
            createdAt: "2023-06-15T08:45:12Z",
            updatedAt: "2023-06-15T08:45:12Z"
          },
          {
            id: 2,
            contentId: contentId,
            number: 2,
            title: "Cuộc phiêu lưu bắt đầu",
            isLocked: false,
            unlockPrice: 0,
            views: 4500,
            createdAt: "2023-06-20T09:30:24Z",
            updatedAt: "2023-06-20T09:30:24Z"
          },
          {
            id: 3,
            contentId: contentId,
            number: 3,
            title: "Bí mật hé lộ",
            isLocked: true,
            unlockPrice: 2000,
            views: 3800,
            createdAt: "2023-06-25T10:15:36Z",
            updatedAt: "2023-06-25T10:15:36Z"
          },
          {
            id: 4,
            contentId: contentId,
            number: 4,
            title: "Gặp gỡ nhân vật mới",
            isLocked: true,
            unlockPrice: 2000,
            views: 3200,
            createdAt: "2023-06-30T11:00:48Z",
            updatedAt: "2023-06-30T11:00:48Z"
          },
          {
            id: 5,
            contentId: contentId,
            number: 5,
            title: "Cuộc chiến đầu tiên",
            isLocked: true,
            unlockPrice: 3000,
            views: 2800,
            createdAt: "2023-07-05T13:45:12Z",
            updatedAt: "2023-07-05T13:45:12Z"
          }
        ]
      };
    }
  });

  // Filter chapters based on search term
  const filteredChapters = contentDetails?.chapters.filter(chapter => 
    chapter.title.toLowerCase().includes(search.toLowerCase()) ||
    chapter.number.toString().includes(search)
  ) || [];

  // Pagination logic
  const totalPages = Math.ceil((filteredChapters.length || 0) / limit);
  const handlePrevPage = () => setPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setPage(prev => Math.min(totalPages, prev + 1));
  
  // Current page chapters
  const currentChapters = filteredChapters.slice((page - 1) * limit, page * limit);

  // Content type label
  const contentTypeLabel = contentDetails?.content.type === 'manga' ? 'Truyện tranh' : 'Truyện chữ';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" asChild>
              <a href="/admin/manga">
                <ArrowLeft className="h-4 w-4" />
              </a>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {loadingContent ? "Đang tải..." : contentDetails?.content.title}
            </h1>
            <Badge variant={contentDetails?.content.type === 'manga' ? 'default' : 'secondary'}>
              {contentTypeLabel}
            </Badge>
          </div>
          
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm chương mới
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="chapters">Danh sách chương</TabsTrigger>
            <TabsTrigger value="details">Thông tin truyện</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chapters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý chương truyện</CardTitle>
                <CardDescription>
                  Thêm, sửa, xóa và quản lý chương truyện và nội dung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex mb-4">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm theo số chương hoặc tiêu đề..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chương</TableHead>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead className="text-center">Trạng thái</TableHead>
                        <TableHead className="text-right">Giá mở khóa</TableHead>
                        <TableHead className="text-right">Lượt xem</TableHead>
                        <TableHead className="text-right">Cập nhật</TableHead>
                        <TableHead className="text-center">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingContent ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Đang tải dữ liệu...
                          </TableCell>
                        </TableRow>
                      ) : currentChapters.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Không tìm thấy dữ liệu
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentChapters.map((chapter) => (
                          <TableRow key={chapter.id}>
                            <TableCell className="font-medium">Chương {chapter.number}</TableCell>
                            <TableCell>{chapter.title}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={chapter.isLocked ? 'secondary' : 'outline'}>
                                {chapter.isLocked ? 'Đã khóa' : 'Mở'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {chapter.isLocked ? formatCurrency(chapter.unlockPrice) : 'Miễn phí'}
                            </TableCell>
                            <TableCell className="text-right">{chapter.views.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{formatDate(chapter.updatedAt)}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center space-x-2">
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={`/${contentDetails?.content.type}/${contentId}/chapter/${chapter.id}`} target="_blank">
                                    <Eye className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {chapter.isLocked ? (
                                  <Button variant="ghost" size="icon">
                                    <Unlock className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button variant="ghost" size="icon">
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Trang trước</span>
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Trang {page} / {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Trang sau</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin truyện</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingContent ? (
                  <div className="text-center py-4">Đang tải dữ liệu...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div className="aspect-[3/4] rounded-md overflow-hidden border">
                        <img 
                          src={contentDetails?.content.coverImage} 
                          alt={contentDetails?.content.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button>
                          <Upload className="mr-2 h-4 w-4" />
                          Cập nhật ảnh bìa
                        </Button>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 space-y-4">
                      <div className="space-y-2">
                        <label className="font-medium text-sm">Tiêu đề</label>
                        <Input value={contentDetails?.content.title} />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="font-medium text-sm">Tác giả</label>
                        <Input value={contentDetails?.author.name} />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="font-medium text-sm">Năm phát hành</label>
                        <Input type="number" value={contentDetails?.content.releaseYear} />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="font-medium text-sm">Mô tả</label>
                        <textarea 
                          className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={contentDetails?.content.description}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="font-medium text-sm">Thể loại</label>
                        <div className="flex flex-wrap gap-2">
                          {contentDetails?.genres.map(genre => (
                            <Badge key={genre.id} variant="outline">{genre.name}</Badge>
                          ))}
                          <Button variant="outline" size="sm">
                            <Plus className="h-3 w-3 mr-1" />
                            Thêm
                          </Button>
                        </div>
                      </div>
                      
                      <div className="pt-4 flex justify-end space-x-2">
                        <Button variant="outline">Hủy</Button>
                        <Button>Lưu thay đổi</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

export default ChapterManagementPage;