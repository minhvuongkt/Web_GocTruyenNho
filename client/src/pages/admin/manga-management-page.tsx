import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Search, 
  Eye, 
  AlertTriangle, 
  X, 
  Download, 
  SortAsc, 
  SortDesc, 
  FileSpreadsheet, 
  Copy, 
  CheckSquare,
  ChevronDown,
  Info,
  LineChart,
  Bookmark,
  Image as ImageIcon,
  CalendarDays,
  Tags,
  Users
} from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

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

  // Thêm các state mới
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);
  const [detailContent, setDetailContent] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState<any>(null);
  const [showDeleteTrashDialog, setShowDeleteTrashDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const csvLinkRef = useRef<HTMLAnchorElement>(null);

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

  // Hàm xuất dữ liệu dạng CSV
  const exportToCSV = () => {
    if (!contentList?.content.length) return;
    
    // Tạo header cho file CSV
    const headers = [
      "ID", "Tên truyện", "Tên khác", "Tác giả", "Nhóm dịch", 
      "Năm xuất bản", "Thể loại", "Trạng thái", "Lượt xem", 
      "Số chương", "Ngày tạo", "Cập nhật"
    ];
    
    // Tạo dữ liệu cho file CSV
    const data = contentList.content.map(item => [
      item.id,
      item.title,
      item.alternativeTitle || "",
      item.authorName || "",
      item.translationGroupName || "",
      item.releaseYear || "",
      item.genres?.map((g: any) => g.name).join(", ") || "",
      getStatusLabel(item.status),
      item.views,
      item.chapters,
      formatDate(item.createdAt),
      formatDate(item.updatedAt)
    ]);
    
    // Tạo nội dung file CSV
    let csvContent = "data:text/csv;charset=utf-8," + 
      headers.join(",") + "\n" + 
      data.map(row => row.join(",")).join("\n");
    
    // Tạo URL và download file
    const encodedUri = encodeURI(csvContent);
    if (csvLinkRef.current) {
      csvLinkRef.current.setAttribute("href", encodedUri);
      csvLinkRef.current.setAttribute("download", `truyen-${new Date().toISOString().slice(0,10)}.csv`);
      csvLinkRef.current.click();
    }
  };

  // Hàm sắp xếp dữ liệu
  const sortData = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ key, direction });
  };

  // Hàm lọc và sắp xếp dữ liệu
  const getSortedAndFilteredContent = () => {
    if (!contentList?.content) return [];

    // Lọc theo tìm kiếm
    let filtered = [...contentList.content].filter(item => 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.authorName && item.authorName.toLowerCase().includes(search.toLowerCase()))
    );
    
    // Lọc theo thể loại
    if (genreFilter !== "all") {
      filtered = filtered.filter(item => 
        item.genres && item.genres.some((genre: any) => genre.id.toString() === genreFilter)
      );
    }
    
    // Lọc theo trạng thái
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Sắp xếp dữ liệu
    if (sortConfig) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  };

  // Xử lý chọn/bỏ chọn tất cả
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = getSortedAndFilteredContent().map(item => item.id);
      setSelectedItems(allIds);
    } else {
      setSelectedItems([]);
    }
  };

  // Xử lý chọn/bỏ chọn một mục
  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  // Xử lý xóa nhiều mục
  const handleBulkDelete = () => {
    setShowDeleteTrashDialog(true);
  };

  // Xử lý xem chi tiết
  const handleViewDetail = (item: any) => {
    setDetailContent(item);
    setIsViewDetailOpen(true);
  };

  // Xử lý chỉnh sửa
  const handleEdit = (item: any) => {
    setEditContent({
      ...item,
      authorId: item.authorId.toString(),
      translationGroupId: item.translationGroupId ? item.translationGroupId.toString() : "",
      genreIds: item.genres ? item.genres.map((g: any) => g.id) : []
    });
    setIsEditDialogOpen(true);
  };

  // Lấy dữ liệu đã lọc và sắp xếp
  const filteredContent = getSortedAndFilteredContent();

  // Danh sách các mục đã chọn
  const selectedContent = filteredContent.filter(item => selectedItems.includes(item.id));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Quản lý truyện</h1>
          <div className="flex space-x-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm truyện mới
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Thêm truyện mới</DialogTitle>
                  <DialogDescription>
                    Điền thông tin chi tiết về truyện bạn muốn thêm.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">Tên truyện <span className="text-red-500">*</span></Label>
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
                      <Label htmlFor="alternativeTitle" className="text-right">Tên khác</Label>
                      <Input
                        id="alternativeTitle"
                        name="alternativeTitle"
                        className="col-span-3"
                        value={newContent.alternativeTitle || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="type" className="text-right">Loại truyện <span className="text-red-500">*</span></Label>
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
                      <Label htmlFor="authorId" className="text-right">Tác giả <span className="text-red-500">*</span></Label>
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
                      <Label htmlFor="translationGroupId" className="text-right">Nhóm dịch</Label>
                      <Select
                        name="translationGroupId"
                        value={newContent.translationGroupId || ""}
                        onValueChange={(value) => handleSelectChange("translationGroupId", value)}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Chọn nhóm dịch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Không có</SelectItem>
                          {/* Thay thế bằng dữ liệu thực từ API */}
                          <SelectItem value="1">Nhóm dịch A</SelectItem>
                          <SelectItem value="2">Nhóm dịch B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="releaseYear" className="text-right">Năm xuất bản</Label>
                      <Input
                        id="releaseYear"
                        name="releaseYear"
                        className="col-span-3"
                        placeholder="2023"
                        value={newContent.releaseYear || ""}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="status" className="text-right">Trạng thái <span className="text-red-500">*</span></Label>
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
                          <SelectItem value="hiatus">Tạm dừng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="coverImage" className="text-right">URL ảnh bìa</Label>
                      <div className="col-span-3 flex gap-2">
                        <Input
                          id="coverImage"
                          name="coverImage"
                          placeholder="https://example.com/image.jpg"
                          className="flex-1"
                          value={newContent.coverImage || ""}
                          onChange={handleInputChange}
                        />
                        <Button type="button" variant="outline" size="icon">
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="description" className="text-right pt-2">Mô tả <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="description"
                        name="description"
                        className="col-span-3"
                        rows={5}
                        value={newContent.description || ""}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">Thể loại</Label>
                      <div className="col-span-3 grid grid-cols-3 gap-2">
                        {genres?.map(genre => (
                          <div key={genre.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`genre-${genre.id}`} 
                              checked={newContent.genreIds?.includes(genre.id)} 
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewContent(prev => ({
                                    ...prev,
                                    genreIds: [...(prev.genreIds || []), genre.id]
                                  }));
                                } else {
                                  setNewContent(prev => ({
                                    ...prev,
                                    genreIds: prev.genreIds?.filter(id => id !== genre.id) || []
                                  }));
                                }
                              }}
                            />
                            <label 
                              htmlFor={`genre-${genre.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {genre.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button type="button" variant="outline" className="mr-2">
                      Xem trước
                    </Button>
                    <Button type="submit" disabled={createContentMutation.isPending}>
                      {createContentMutation.isPending ? (
                        <>
                          <span className="mr-2">Đang xử lý</span>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        </>
                      ) : "Thêm truyện"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={exportToCSV}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Xuất dữ liệu
            </Button>
            <a ref={csvLinkRef} className="hidden"></a>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <CardTitle>Danh sách truyện</CardTitle>
              <div className="flex space-x-2">
                {selectedItems.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa ({selectedItems.length})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên truyện hoặc tác giả..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <Select
                value={genreFilter}
                onValueChange={setGenreFilter}
              >
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Thể loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thể loại</SelectItem>
                  {genres?.map(genre => (
                    <SelectItem key={genre.id} value={genre.id.toString()}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ongoing">Đang tiến hành</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="hiatus">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedItems.length > 0 && selectedItems.length === filteredContent.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Chọn tất cả"
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => sortData('id')}
                    >
                      ID
                      {sortConfig?.key === 'id' && (
                        sortConfig.direction === 'asc' ? <SortAsc className="ml-1 h-3 w-3 inline" /> : <SortDesc className="ml-1 h-3 w-3 inline" />
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => sortData('title')}
                    >
                      Tên truyện
                      {sortConfig?.key === 'title' && (
                        sortConfig.direction === 'asc' ? <SortAsc className="ml-1 h-3 w-3 inline" /> : <SortDesc className="ml-1 h-3 w-3 inline" />
                      )}
                    </TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Nhóm dịch</TableHead>
                    <TableHead>Năm XB</TableHead>
                    <TableHead>Thể loại</TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => sortData('status')}
                    >
                      Trạng thái
                      {sortConfig?.key === 'status' && (
                        sortConfig.direction === 'asc' ? <SortAsc className="ml-1 h-3 w-3 inline" /> : <SortDesc className="ml-1 h-3 w-3 inline" />
                      )}
                    </TableHead>
                    <TableHead className="text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        <div className="flex justify-center items-center">
                          <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></span>
                          Đang tải dữ liệu...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredContent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        Không tìm thấy dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContent.map((item: any) => (
                      <TableRow key={item.id} className={selectedItems.includes(item.id) ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked === true)}
                            aria-label={`Chọn ${item.title}`}
                          />
                        </TableCell>
                        <TableCell>{item.id}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {item.title}
                          {item.alternativeTitle && (
                            <div className="text-xs text-muted-foreground truncate">{item.alternativeTitle}</div>
                          )}
                        </TableCell>
                        <TableCell>{item.authorName || "—"}</TableCell>
                        <TableCell>{item.translationGroupName || "—"}</TableCell>
                        <TableCell>{item.releaseYear || "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {item.genres?.slice(0, 2).map((genre: any) => (
                              <Badge key={genre.id} variant="outline" className="text-xs">
                                {genre.name}
                              </Badge>
                            ))}
                            {item.genres && item.genres.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.genres.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            item.status === 'ongoing' ? 'default' : 
                            item.status === 'completed' ? 'success' : 'secondary'
                          }>
                            {getStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetail(item)}>
                                  <Info className="mr-2 h-4 w-4" />
                                  Xem chi tiết
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <a href={`/${item.type}/${item.id}`} target="_blank" className="flex cursor-pointer items-center">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Xem trang truyện
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <a href={`/admin/chapters/${item.id}`} className="flex cursor-pointer items-center">
                                    <Bookmark className="mr-2 h-4 w-4" />
                                    Quản lý chương
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(item.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Xóa truyện
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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