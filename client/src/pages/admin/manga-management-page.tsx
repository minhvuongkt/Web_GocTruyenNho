import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  BookOpen,
  Image as ImageIcon,
  CalendarDays,
  Tags,
  Users,
  User
} from "lucide-react";
import { formatDate, getStatusLabel, getContentStatusLabel } from "@/lib/utils";
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
  const [location, setLocation] = useLocation();
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
    genreIds: [],
    translationGroupId: null,
    releaseYear: null,
    alternativeTitle: null
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
        return { content: [], total: 0 };
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
  
  // Fetch translation groups for select dropdown
  const { data: translationGroups } = useQuery({
    queryKey: ["/api/translation-groups"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/translation-groups");
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch translation groups:", error);
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
        genreIds: [],
        translationGroupId: null,
        releaseYear: null,
        alternativeTitle: null
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

  // Update content mutation
  const updateContentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/content/${data.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật truyện thành công",
        description: "Thông tin truyện đã được cập nhật",
      });
      // Reset form and close dialog
      setIsEditDialogOpen(false);
      setEditContent(null);
      // Refresh content list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        title: "Không thể cập nhật truyện",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi cập nhật truyện",
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
    // Chuyển đổi các trường ID từ chuỗi sang số
    if (name === "authorId" || name === "translationGroupId") {
      // Nếu giá trị là "0" thì đặt giá trị thành null (không có nhóm dịch)
      if (name === "translationGroupId" && value === "0") {
        setNewContent(prev => ({ ...prev, [name]: null }));
      } else {
        setNewContent(prev => ({ ...prev, [name]: parseInt(value, 10) }));
      }
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
      getContentStatusLabel(item.status),
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
                          {authors && authors.length > 0 ? (
                            authors.map(author => (
                              <SelectItem key={author.id} value={author.id.toString()}>
                                {author.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-author" disabled>Không có tác giả</SelectItem>
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
                          <SelectItem value="0">Không có</SelectItem>
                          {translationGroups && translationGroups.length > 0 && 
                            translationGroups.map(group => (
                              <SelectItem key={group.id} value={group.id.toString()}>
                                {group.name}
                              </SelectItem>
                            ))
                          }
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
                      <Label htmlFor="coverImageFile" className="text-right">Ảnh bìa</Label>
                      <div className="col-span-3 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            id="coverImageFile"
                            name="coverImageFile"
                            type="file"
                            className="flex-1"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  // Tạo FormData để tải lên file
                                  const formData = new FormData();
                                  formData.append('coverImage', file);
                                  
                                  // Gửi file lên server
                                  const response = await fetch('/api/upload/cover', {
                                    method: 'POST',
                                    body: formData,
                                    credentials: 'include'
                                  });
                                  
                                  if (!response.ok) {
                                    throw new Error('Lỗi khi tải ảnh lên');
                                  }
                                  
                                  const data = await response.json();
                                  
                                  // Cập nhật state với đường dẫn ảnh từ server
                                  setNewContent(prev => ({
                                    ...prev,
                                    coverImage: data.coverImagePath
                                  }));
                                  
                                  toast({
                                    title: "Tải ảnh thành công",
                                    description: "Ảnh bìa đã được tải lên"
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Lỗi tải ảnh",
                                    description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải ảnh bìa",
                                    variant: "destructive"
                                  });
                                }
                              }
                            }}
                          />
                        </div>
                        {newContent.coverImage && (
                          <div className="mt-2 border rounded p-2 w-36 relative group">
                            <img 
                              src={newContent.coverImage} 
                              alt="Ảnh bìa" 
                              className="w-full h-auto"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setNewContent(prev => ({ ...prev, coverImage: '' }))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="mr-2"
                          disabled={!newContent.title || !newContent.description}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Xem trước
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[800px]">
                        <DialogHeader>
                          <DialogTitle>Xem trước truyện</DialogTitle>
                          <DialogDescription>
                            Xem trước thông tin truyện trước khi thêm vào hệ thống.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-32 h-44 relative overflow-hidden rounded-md border border-border bg-muted">
                              {newContent.coverImage ? (
                                <img 
                                  src={newContent.coverImage} 
                                  alt={newContent.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                  <ImageIcon className="h-12 w-12" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h2 className="text-xl font-bold">{newContent.title}</h2>
                              {newContent.alternativeTitle && (
                                <p className="text-muted-foreground">{newContent.alternativeTitle}</p>
                              )}
                              
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  {newContent.releaseYear || "N/A"}
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  {newContent.type === 'manga' ? (
                                    <>
                                      <BookOpen className="h-3 w-3" />
                                      Truyện tranh
                                    </>
                                  ) : (
                                    <>
                                      <Bookmark className="h-3 w-3" />
                                      Truyện chữ
                                    </>
                                  )}
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Info className="h-3 w-3" />
                                  {getStatusLabel(newContent.status as any)}
                                </Badge>
                              </div>
                              
                              <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">Tác giả:</span>
                                  <span>
                                    {authors?.find(a => a.id === parseInt(newContent.authorId.toString()))?.name || "Chưa chọn"}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">Nhóm dịch:</span>
                                  <span>
                                    {newContent.translationGroupId
                                      ? translationGroups?.find(g => g.id === parseInt(newContent.translationGroupId!.toString()))?.name
                                      : "Không có"}
                                  </span>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                  <Tags className="h-4 w-4 text-muted-foreground mt-1" />
                                  <span className="font-medium mt-0.5">Thể loại:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {newContent.genreIds && newContent.genreIds.length > 0
                                      ? newContent.genreIds.map(genreId => (
                                          <Badge key={genreId} variant="secondary" className="text-xs">
                                            {genres?.find(g => g.id === genreId)?.name || ""}
                                          </Badge>
                                        ))
                                      : <span className="text-muted-foreground">Chưa chọn thể loại</span>
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-medium mb-2">Mô tả:</h3>
                            <div className="bg-muted rounded-md p-3 text-sm whitespace-pre-line">
                              {newContent.description || "Không có mô tả"}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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

                        <TableCell className="font-medium max-w-[200px] truncate">
                          {item.title}
                          {item.alternativeTitle && (
                            <div className="text-xs text-muted-foreground truncate">{item.alternativeTitle}</div>
                          )}
                        </TableCell>
                        <TableCell>{item.author?.name || "—"}</TableCell>
                        <TableCell>{item.translationGroup?.name || "—"}</TableCell>
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
                            {getContentStatusLabel(item.status)}
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
                                <DropdownMenuItem onClick={() => setLocation(`/admin/chapters/${item.id}`)}>
                                  <Bookmark className="mr-2 h-4 w-4" />
                                  Quản lý chương
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

        {/* Chi tiết truyện Dialog */}
        <Dialog open={isViewDetailOpen} onOpenChange={setIsViewDetailOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            {detailContent && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>{detailContent.title}</span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(
                          `ID: ${detailContent.id}\nTên: ${detailContent.title}\nTác giả: ${detailContent.author?.name || "—"}\nThể loại: ${detailContent.genres?.map((g: any) => g.name).join(", ") || "—"}\nTrạng thái: ${getContentStatusLabel(detailContent.status)}`
                        );
                        toast({
                          title: "Đã sao chép thông tin",
                          description: "Thông tin truyện đã được sao chép vào clipboard",
                        });
                      }}>
                        <Copy className="mr-2 h-4 w-4" />
                        Sao chép
                      </Button>
                      <Button variant="default" size="sm" onClick={() => {
                        setIsViewDetailOpen(false);
                        setLocation(`/admin/chapters/${detailContent.id}`);
                      }}>
                        <Bookmark className="mr-2 h-4 w-4" />
                        Quản lý chương
                      </Button>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="info">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="info">Thông tin chính</TabsTrigger>
                    <TabsTrigger value="history">Lịch sử chỉnh sửa</TabsTrigger>
                    <TabsTrigger value="stats">Thống kê</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium">ID</h3>
                          <p>{detailContent.id}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Tên truyện</h3>
                          <p>{detailContent.title}</p>
                        </div>
                        {detailContent.alternativeTitle && (
                          <div>
                            <h3 className="text-sm font-medium">Tên khác</h3>
                            <p>{detailContent.alternativeTitle}</p>
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-medium">Loại truyện</h3>
                          <p>{detailContent.type === 'manga' ? 'Truyện tranh' : 'Truyện chữ'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Tác giả</h3>
                          <p>{detailContent.author?.name || "—"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Nhóm dịch</h3>
                          <p>{detailContent.translationGroup?.name || "—"}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium">Năm xuất bản</h3>
                          <p>{detailContent.releaseYear || "—"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Trạng thái</h3>
                          <Badge>{getContentStatusLabel(detailContent.status)}</Badge>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Thể loại</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {detailContent.genres?.map((genre: any) => (
                              <Badge key={genre.id} variant="outline">
                                {genre.name}
                              </Badge>
                            )) || "—"}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Ngày tạo</h3>
                          <p>{formatDate(detailContent.createdAt)}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Cập nhật lần cuối</h3>
                          <p>{formatDate(detailContent.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium">Mô tả</h3>
                      <p className="mt-1 text-sm">{detailContent.description || "—"}</p>
                    </div>

                    {detailContent.coverImage && (
                      <div>
                        <h3 className="text-sm font-medium">Ảnh bìa</h3>
                        <div className="mt-2 w-40 h-60 bg-muted rounded-md overflow-hidden">
                          <img 
                            src={detailContent.coverImage} 
                            alt={detailContent.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="history" className="space-y-4 mt-4">
                    <div className="text-center text-muted-foreground py-12">
                      Chức năng đang phát triển
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="stats" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{detailContent.views?.toLocaleString() || 0}</div>
                            <p className="text-xs text-muted-foreground">Lượt xem</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{detailContent.chapters || 0}</div>
                            <p className="text-xs text-muted-foreground">Chương</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {detailContent.chapters ? Math.round(detailContent.views / detailContent.chapters).toLocaleString() : 0}
                            </div>
                            <p className="text-xs text-muted-foreground">Lượt xem/chương</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="text-center text-muted-foreground py-6">
                      Biểu đồ đang phát triển
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa truyện</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin chi tiết về truyện.
              </DialogDescription>
            </DialogHeader>
            {editContent && (
              <form onSubmit={(e) => {
                e.preventDefault();
                // Convert genreIds to array of numbers if it's an array of strings
                const formattedContent = {
                  ...editContent,
                  genreIds: Array.isArray(editContent.genreIds) 
                    ? editContent.genreIds.map(id => typeof id === 'string' ? parseInt(id) : id)
                    : [],
                  authorId: parseInt(editContent.authorId.toString()),
                  translationGroupId: editContent.translationGroupId 
                    ? parseInt(editContent.translationGroupId.toString()) 
                    : null
                };
                
                // Use the mutation
                updateContentMutation.mutate(formattedContent);
              }}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-title" className="text-right">Tên truyện <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-title"
                      name="title"
                      className="col-span-3"
                      value={editContent.title}
                      onChange={(e) => setEditContent({...editContent, title: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-alternativeTitle" className="text-right">Tên khác</Label>
                    <Input
                      id="edit-alternativeTitle"
                      name="alternativeTitle"
                      className="col-span-3"
                      value={editContent.alternativeTitle || ""}
                      onChange={(e) => setEditContent({...editContent, alternativeTitle: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-type" className="text-right">Loại truyện <span className="text-red-500">*</span></Label>
                    <Select
                      name="type"
                      value={editContent.type}
                      onValueChange={(value) => setEditContent({...editContent, type: value})}
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
                    <Label htmlFor="edit-authorId" className="text-right">Tác giả <span className="text-red-500">*</span></Label>
                    <Select
                      name="authorId"
                      value={editContent.authorId}
                      onValueChange={(value) => setEditContent({...editContent, authorId: value})}
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
                    <Label htmlFor="edit-translationGroupId" className="text-right">Nhóm dịch</Label>
                    <Select
                      name="translationGroupId"
                      value={editContent.translationGroupId || ""}
                      onValueChange={(value) => {
                        // Nếu giá trị là "0" thì đặt giá trị thành null (không có nhóm dịch)
                        if (value === "0") {
                          setEditContent({...editContent, translationGroupId: null});
                        } else {
                          setEditContent({...editContent, translationGroupId: parseInt(value, 10)});
                        }
                      }}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Chọn nhóm dịch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Không có</SelectItem>
                        {translationGroups?.map(group => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        )) || (
                          <SelectItem value="1">Nhóm dịch mặc định</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-releaseYear" className="text-right">Năm xuất bản</Label>
                    <Input
                      id="edit-releaseYear"
                      name="releaseYear"
                      className="col-span-3"
                      placeholder="2023"
                      value={editContent.releaseYear || ""}
                      onChange={(e) => setEditContent({...editContent, releaseYear: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-status" className="text-right">Trạng thái <span className="text-red-500">*</span></Label>
                    <Select
                      name="status"
                      value={editContent.status}
                      onValueChange={(value) => setEditContent({...editContent, status: value})}
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
                    <Label htmlFor="edit-coverImageFile" className="text-right">Ảnh bìa</Label>
                    <div className="col-span-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          id="edit-coverImageFile"
                          name="coverImageFile"
                          type="file"
                          className="flex-1"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                // Tạo FormData để tải lên file
                                const formData = new FormData();
                                formData.append('coverImage', file);
                                
                                // Gửi file lên server
                                const response = await fetch('/api/upload/cover', {
                                  method: 'POST',
                                  body: formData,
                                  credentials: 'include'
                                });
                                
                                if (!response.ok) {
                                  throw new Error('Lỗi khi tải ảnh lên');
                                }
                                
                                const data = await response.json();
                                
                                // Cập nhật state với đường dẫn ảnh từ server
                                setEditContent(prev => ({
                                  ...prev,
                                  coverImage: data.coverImagePath
                                }));
                                
                                toast({
                                  title: "Tải ảnh thành công",
                                  description: "Ảnh bìa đã được tải lên"
                                });
                              } catch (error) {
                                toast({
                                  title: "Lỗi tải ảnh",
                                  description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải ảnh bìa",
                                  variant: "destructive"
                                });
                              }
                            }
                          }}
                        />
                      </div>
                      {editContent.coverImage && (
                        <div className="mt-2 border rounded p-2 w-36 relative group">
                          <img 
                            src={editContent.coverImage} 
                            alt="Ảnh bìa" 
                            className="w-full h-auto"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setEditContent(prev => ({ ...prev, coverImage: '' }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="edit-description" className="text-right pt-2">Mô tả <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="edit-description"
                      name="description"
                      className="col-span-3"
                      rows={5}
                      value={editContent.description || ""}
                      onChange={(e) => setEditContent({...editContent, description: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Thể loại</Label>
                    <div className="col-span-3 grid grid-cols-3 gap-2">
                      {genres?.map(genre => (
                        <div key={genre.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`edit-genre-${genre.id}`} 
                            checked={editContent.genreIds?.includes(genre.id)} 
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEditContent(prev => ({
                                  ...prev,
                                  genreIds: [...(prev.genreIds || []), genre.id]
                                }));
                              } else {
                                setEditContent(prev => ({
                                  ...prev,
                                  genreIds: prev.genreIds?.filter(id => id !== genre.id) || []
                                }));
                              }
                            }}
                          />
                          <label 
                            htmlFor={`edit-genre-${genre.id}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {genre.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="edit-internal-notes" className="text-right pt-2">Ghi chú nội bộ</Label>
                    <Textarea
                      id="edit-internal-notes"
                      name="internalNotes"
                      className="col-span-3"
                      rows={3}
                      value={editContent.internalNotes || ""}
                      onChange={(e) => setEditContent({...editContent, internalNotes: e.target.value})}
                      placeholder="Ghi chú dành cho admin, không hiển thị cho người dùng"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="button" variant="outline" className="mr-2">
                    Lưu nháp
                  </Button>
                  <Button type="submit">
                    Cập nhật
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Soft Delete Dialog */}
        <Dialog open={showDeleteTrashDialog} onOpenChange={setShowDeleteTrashDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chuyển vào thùng rác</DialogTitle>
              <DialogDescription>
                Truyện sẽ được chuyển vào thùng rác và có thể khôi phục trong vòng 30 ngày.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="delete-reason">Lý do xóa</Label>
                <Textarea
                  id="delete-reason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Nhập lý do xóa truyện này..."
                  rows={3}
                />
              </div>
              {selectedItems.length > 0 && (
                <div>
                  <Label>Truyện sẽ bị xóa ({selectedItems.length})</Label>
                  <div className="mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    <ul className="text-sm">
                      {selectedContent.map(item => (
                        <li key={item.id} className="py-1">
                          {item.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteTrashDialog(false)}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={() => {
                // Implement soft delete here
                toast({
                  title: "Đã chuyển vào thùng rác",
                  description: `${selectedItems.length} truyện đã được chuyển vào thùng rác`,
                });
                setSelectedItems([]);
                setShowDeleteTrashDialog(false);
              }}>
                Xác nhận
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default MangaManagementPage;