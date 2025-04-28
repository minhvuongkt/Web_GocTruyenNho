import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Search, Eye, AlertTriangle, X } from "lucide-react";
import { formatDate, getStatusLabel } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export function MangaManagementPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<number | null>(null);
  
  // State for new content form
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    type: "manga",
    authorId: 1,
    status: "ongoing",
    coverImage: "",
    genreIds: []
  });
  
  // Fetch manga/novel content list
  const { data: contentList, isLoading } = useQuery({
    queryKey: ["/api/admin/content"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/content?all=true");
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch content:", error);
        // Fallback to mock data if API fails
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
    }
  });
  
  // Fetch authors for select dropdown
  const { data: authors } = useQuery({
    queryKey: ["/api/authors"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/authors");
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch authors:", error);
        return [];
      }
    }
  });
  
  // Fetch genres for select dropdown
  const { data: genres } = useQuery({
    queryKey: ["/api/genres"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/genres");
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch genres:", error);
        return [];
      }
    }
  });

  // Create content mutation
  const createContentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/content", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thêm truyện thành công",
        description: "Truyện mới đã được thêm vào hệ thống",
      });
      // Reset form and close dialog
      setNewContent({
        title: "",
        description: "",
        type: "manga",
        authorId: 1,
        status: "ongoing",
        coverImage: "",
        genreIds: []
      });
      setIsAddDialogOpen(false);
      // Refresh content list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
    },
    onError: (error) => {
      toast({
        title: "Không thể thêm truyện",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi thêm truyện mới",
        variant: "destructive",
      });
    }
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/content/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Xóa truyện thành công",
        description: "Truyện đã được xóa khỏi hệ thống",
      });
      // Refresh content list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
    },
    onError: (error) => {
      toast({
        title: "Không thể xóa truyện",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa truyện",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setContentToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewContent(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    // Chuyển đổi authorId từ chuỗi sang số
    if (name === "authorId") {
      setNewContent(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setNewContent(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createContentMutation.mutate(newContent);
  };

  // Handle delete confirmation
  const handleDelete = (id: number) => {
    setContentToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete action
  const confirmDelete = () => {
    if (contentToDelete) {
      deleteContentMutation.mutate(contentToDelete);
    }
  };

  // Filter content based on search term
  const filteredContent = contentList?.content.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.authorName?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Quản lý truyện</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Thêm truyện mới
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Thêm truyện mới</DialogTitle>
                <DialogDescription>
                  Điền thông tin chi tiết về truyện bạn muốn thêm.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">Tên truyện</Label>
                    <Input
                      id="title"
                      name="title"
                      className="col-span-3"
                      value={newContent.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Loại truyện</Label>
                    <Select
                      name="type"
                      value={newContent.type}
                      onValueChange={(value) => handleSelectChange("type", value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Chọn loại truyện" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manga">Truyện tranh</SelectItem>
                        <SelectItem value="novel">Truyện chữ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="authorId" className="text-right">Tác giả</Label>
                    <Select
                      name="authorId"
                      value={newContent.authorId.toString()}
                      onValueChange={(value) => handleSelectChange("authorId", value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Chọn tác giả" />
                      </SelectTrigger>
                      <SelectContent>
                        {authors?.map(author => (
                          <SelectItem key={author.id} value={author.id.toString()}>
                            {author.name}
                          </SelectItem>
                        )) || (
                          <SelectItem value="1">Tác giả mặc định</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">Trạng thái</Label>
                    <Select
                      name="status"
                      value={newContent.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ongoing">Đang tiến hành</SelectItem>
                        <SelectItem value="completed">Hoàn thành</SelectItem>
                        <SelectItem value="dropped">Đã ngừng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="coverImage" className="text-right">Ảnh bìa URL</Label>
                    <Input
                      id="coverImage"
                      name="coverImage"
                      placeholder="https://example.com/image.jpg"
                      className="col-span-3"
                      value={newContent.coverImage}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">Mô tả</Label>
                    <Textarea
                      id="description"
                      name="description"
                      className="col-span-3"
                      rows={5}
                      value={newContent.description}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createContentMutation.isPending}>
                    {createContentMutation.isPending ? "Đang xử lý..." : "Thêm truyện"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                            >
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
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa truyện</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này không thể khôi phục. Truyện này sẽ bị xóa vĩnh viễn khỏi hệ thống cùng với tất cả các chương và dữ liệu liên quan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleteContentMutation.isPending ? (
                  <>
                    <span className="mr-2">Đang xử lý</span>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Xác nhận xóa
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

export default MangaManagementPage;