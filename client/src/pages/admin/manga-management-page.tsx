import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Search, Eye } from "lucide-react";
import { formatDate, getStatusLabel } from "@/lib/utils";

export function MangaManagementPage() {
  const [search, setSearch] = useState("");
  
  // Fetch manga/novel content list
  const { data: contentList, isLoading } = useQuery({
    queryKey: ["/api/admin/content"],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // For now, we'll return mock data
      return {
        content: [
          { 
            id: 1, 
            title: "Thám Tử Lừng Danh", 
            type: "manga", 
            authorId: 1,
            authorName: "Aoyama Gosho",
            status: "ongoing", 
            views: 12345,
            chapters: 123,
            createdAt: "2023-01-15T08:45:12Z",
            updatedAt: "2023-07-15T08:45:12Z" 
          },
          { 
            id: 2, 
            title: "Hoa Anh Đào", 
            type: "manga", 
            authorId: 2,
            authorName: "Sakura Kinomoto",
            status: "ongoing", 
            views: 8765,
            chapters: 45,
            createdAt: "2023-02-14T08:45:12Z",
            updatedAt: "2023-07-14T08:45:12Z" 
          },
          { 
            id: 3, 
            title: "Vũ Trụ Song Song", 
            type: "novel", 
            authorId: 3,
            authorName: "Trần Văn A",
            status: "ongoing", 
            views: 5432,
            chapters: 67,
            createdAt: "2023-03-13T08:45:12Z",
            updatedAt: "2023-07-13T08:45:12Z" 
          },
          { 
            id: 4, 
            title: "Kiếm Sĩ Bóng Đêm", 
            type: "manga", 
            authorId: 4,
            authorName: "Lý Thái B",
            status: "completed", 
            views: 9876,
            chapters: 89,
            createdAt: "2023-04-12T08:45:12Z",
            updatedAt: "2023-07-12T08:45:12Z" 
          },
          { 
            id: 5, 
            title: "Bí Mật Của Naoko", 
            type: "novel", 
            authorId: 5,
            authorName: "Nguyễn Văn C",
            status: "ongoing", 
            views: 3456,
            chapters: 34,
            createdAt: "2023-05-11T08:45:12Z",
            updatedAt: "2023-07-11T08:45:12Z" 
          },
        ],
        total: 5
      };
    }
  });

  // Filter content based on search term
  const filteredContent = contentList?.content.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.authorName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Quản lý truyện</h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm truyện mới
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Danh sách truyện</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên truyện hoặc tác giả..."
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
                    <TableHead>Tên truyện</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Chương</TableHead>
                    <TableHead className="text-right">Lượt xem</TableHead>
                    <TableHead className="text-right">Cập nhật</TableHead>
                    <TableHead className="text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Đang tải dữ liệu...
                      </TableCell>
                    </TableRow>
                  ) : filteredContent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Không tìm thấy dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContent.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <Badge variant={item.type === 'manga' ? 'default' : 'secondary'}>
                            {item.type === 'manga' ? 'Truyện tranh' : 'Truyện chữ'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.authorName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{item.chapters}</TableCell>
                        <TableCell className="text-right">{item.views.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatDate(item.updatedAt)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-2">
                            <Button variant="ghost" size="icon" asChild>
                              <a href={`/${item.type}/${item.id}`} target="_blank">
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <a href={`/admin/chapters/${item.id}`}>
                                <Pencil className="h-4 w-4" />
                              </a>
                            </Button>
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
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default MangaManagementPage;