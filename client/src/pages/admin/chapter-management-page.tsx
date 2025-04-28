import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
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
  Lock, 
  Unlock,
  ArrowLeft,
  Upload,
  ImageIcon,
  FilePlus,
  BookOpen
} from "lucide-react";
import { formatDate } from "@/lib/utils";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function ChapterManagementPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // Lấy ID truyện từ URL, ví dụ: /admin/chapters/123
  const contentId = parseInt(location.split('/').pop() || '0', 10);
  
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({key: 'number', direction: 'desc'});
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [showLockDialog, setShowLockDialog] = useState(false);
  
  // State cho form thêm chương
  const [newChapter, setNewChapter] = useState({
    contentId,
    number: 0,
    title: "",
    isLocked: false,
    unlockPrice: 0
  });
  
  // Fetch thông tin truyện
  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: [`/api/content/${contentId}`],
    queryFn: async () => {
      try {
        if (!contentId) return null;
        const response = await apiRequest("GET", `/api/content/${contentId}`);
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch content:", error);
        return null;
      }
    },
    enabled: !!contentId
  });
  
  // Fetch danh sách chương
  const { data: chapters, isLoading: chaptersLoading } = useQuery({
    queryKey: [`/api/content/${contentId}/chapters`],
    queryFn: async () => {
      try {
        if (!contentId) return [];
        const response = await apiRequest("GET", `/api/content/${contentId}/chapters`);
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch chapters:", error);
        return [];
      }
    },
    enabled: !!contentId
  });
  
  // Mutation tạo chương mới
  const createChapterMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/chapters`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thêm chương thành công",
        description: "Chương mới đã được thêm vào truyện",
      });
      
      // Reset form và đóng dialog
      setNewChapter({
        contentId,
        number: chapters ? Math.max(...chapters.map((c: any) => c.number), 0) + 1 : 1,
        title: "",
        isLocked: false,
        unlockPrice: 0
      });
      
      setIsAddDialogOpen(false);
      
      // Refresh danh sách chương
      queryClient.invalidateQueries({ queryKey: [`/api/content/${contentId}/chapters`] });
    },
    onError: (error) => {
      toast({
        title: "Không thể thêm chương",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi thêm chương mới",
        variant: "destructive",
      });
    }
  });
  
  // Mutation cập nhật khóa/mở khóa chương
  const updateLockStatusMutation = useMutation({
    mutationFn: async ({ chapterId, isLocked, unlockPrice }: { chapterId: number, isLocked: boolean, unlockPrice?: number }) => {
      const response = await apiRequest("PATCH", `/api/chapters/${chapterId}/lock`, { isLocked, unlockPrice });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: `Chương đã được ${selectedChapter?.isLocked ? "mở khóa" : "khóa"}`,
      });
      
      setShowLockDialog(false);
      
      // Refresh danh sách chương
      queryClient.invalidateQueries({ queryKey: [`/api/content/${contentId}/chapters`] });
    },
    onError: (error) => {
      toast({
        title: "Không thể cập nhật trạng thái khóa",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi",
        variant: "destructive",
      });
    }
  });
  
  // Mutation xóa chương
  const deleteChapterMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/chapters/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Xóa chương thành công",
        description: "Chương đã được xóa khỏi truyện",
      });
      
      // Refresh danh sách chương
      queryClient.invalidateQueries({ queryKey: [`/api/content/${contentId}/chapters`] });
    },
    onError: (error) => {
      toast({
        title: "Không thể xóa chương",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa chương",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setChapterToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  });
  
  // Khởi tạo số chương mới ban đầu
  useEffect(() => {
    if (chapters && chapters.length > 0) {
      setNewChapter(prev => ({
        ...prev,
        number: Math.max(...chapters.map((c: any) => c.number), 0) + 1
      }));
    } else {
      setNewChapter(prev => ({
        ...prev,
        number: 1
      }));
    }
  }, [chapters]);
  
  // Xử lý form input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Chuyển đổi thành số nếu cần
    if (name === "number" || name === "unlockPrice") {
      setNewChapter(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setNewChapter(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Xử lý khóa/mở khóa chương
  const handleLockToggle = (chapter: any) => {
    setSelectedChapter(chapter);
    setShowLockDialog(true);
  };
  
  // Xử lý form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createChapterMutation.mutate(newChapter);
  };
  
  // Xử lý xóa chương
  const handleDelete = (id: number) => {
    setChapterToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
  // Xác nhận xóa
  const confirmDelete = () => {
    if (chapterToDelete) {
      deleteChapterMutation.mutate(chapterToDelete);
    }
  };
  
  // Hàm sắp xếp dữ liệu
  const sortData = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ key, direction });
  };
  
  // Lọc và sắp xếp danh sách chương
  const filteredChapters = chapters
    ? [...chapters]
        .filter((chapter: any) => 
          (chapter.title && chapter.title.toLowerCase().includes(search.toLowerCase())) ||
          chapter.number.toString().includes(search)
        )
        .sort((a: any, b: any) => {
          if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        })
    : [];
  
  // Loading state
  if (contentLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[500px]">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Đang tải thông tin truyện...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  // Content not found
  if (!content) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[500px]">
          <div className="flex flex-col items-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-xl font-semibold">Không tìm thấy truyện</h2>
            <p className="mt-2 text-muted-foreground">Không tìm thấy truyện với ID: {contentId}</p>
            <Button 
              className="mt-4" 
              variant="outline"
              onClick={() => setLocation('/admin/manga-management')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại trang quản lý truyện
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Button 
              variant="ghost"
              onClick={() => setLocation('/admin/manga-management')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách truyện
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý chương: {content.title}</h1>
            <p className="text-muted-foreground mt-1">
              Loại: {content.type === 'manga' ? 'Truyện tranh' : 'Truyện chữ'} | 
              Tác giả: {content.authorName || "Không rõ"} | 
              Tổng số chương: {chapters?.length || 0}
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Thêm chương mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm chương mới</DialogTitle>
                <DialogDescription>
                  Thêm chương mới cho truyện: {content.title}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="number" className="text-right">Số chương <span className="text-red-500">*</span></Label>
                    <Input
                      id="number"
                      name="number"
                      type="number"
                      className="col-span-3"
                      value={newChapter.number}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">Tên chương</Label>
                    <Input
                      id="title"
                      name="title"
                      className="col-span-3"
                      value={newChapter.title}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="isLocked" className="text-right">Khóa chương</Label>
                    <div className="flex items-center col-span-3 space-x-2">
                      <Switch
                        id="isLocked"
                        checked={newChapter.isLocked}
                        onCheckedChange={(checked) => setNewChapter(prev => ({ ...prev, isLocked: checked }))}
                      />
                      <Label htmlFor="isLocked" className="cursor-pointer">
                        {newChapter.isLocked ? 'Có' : 'Không'}
                      </Label>
                    </div>
                  </div>
                  {newChapter.isLocked && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="unlockPrice" className="text-right">Giá mở khóa <span className="text-red-500">*</span></Label>
                      <Input
                        id="unlockPrice"
                        name="unlockPrice"
                        type="number"
                        className="col-span-3"
                        value={newChapter.unlockPrice}
                        onChange={handleInputChange}
                        required={newChapter.isLocked}
                        min={1}
                      />
                    </div>
                  )}
                  {content.type === 'manga' ? (
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">Tải ảnh lên</Label>
                      <div className="col-span-3">
                        <Button type="button" variant="outline" className="w-full">
                          <Upload className="mr-2 h-4 w-4" />
                          Chọn file ảnh
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Hỗ trợ các định dạng: JPG, PNG, WEBP. Kích thước tối đa: 5MB/ảnh
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="content" className="text-right pt-2">Nội dung chương</Label>
                      <Textarea
                        id="content"
                        name="content"
                        className="col-span-3"
                        rows={8}
                        placeholder="Nhập nội dung chương tại đây..."
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createChapterMutation.isPending}>
                    {createChapterMutation.isPending ? (
                      <>
                        <span className="mr-2">Đang xử lý</span>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      </>
                    ) : "Thêm chương"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Danh sách chương</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo số hoặc tên chương..."
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
                    <TableHead 
                      className="w-[80px] cursor-pointer"
                      onClick={() => sortData('number')}
                    >
                      <div className="flex items-center">
                        Chương
                        {sortConfig.key === 'number' && (
                          sortConfig.direction === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => sortData('title')}
                    >
                      <div className="flex items-center">
                        Tên chương
                        {sortConfig.key === 'title' && (
                          sortConfig.direction === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px]">Khóa</TableHead>
                    <TableHead className="w-[120px] text-right">Lượt xem</TableHead>
                    <TableHead className="w-[180px] text-right">Ngày tạo</TableHead>
                    <TableHead className="w-[150px] text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chaptersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <div className="flex justify-center items-center">
                          <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></span>
                          Đang tải dữ liệu...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredChapters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {!search ? (
                          <div className="flex flex-col items-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">Truyện chưa có chương nào</p>
                            <Button 
                              className="mt-4" 
                              onClick={() => setIsAddDialogOpen(true)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Thêm chương đầu tiên
                            </Button>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Không tìm thấy chương phù hợp</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredChapters.map((chapter: any) => (
                      <TableRow key={chapter.id}>
                        <TableCell className="font-medium text-center">
                          {chapter.number}
                        </TableCell>
                        <TableCell>{chapter.title || `Chương ${chapter.number}`}</TableCell>
                        <TableCell>
                          {chapter.isLocked ? (
                            <Badge variant="destructive" className="gap-1">
                              <Lock className="h-3 w-3" />
                              <span>{chapter.unlockPrice} xu</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Unlock className="h-3 w-3" />
                              <span>Miễn phí</span>
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {chapter.views?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDate(chapter.releaseDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              asChild
                            >
                              <a href={`/${content.type}/${content.id}/chapter/${chapter.number}`} target="_blank">
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleLockToggle(chapter)}
                            >
                              {chapter.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                // handle edit
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDelete(chapter.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        
        {/* Lock/Unlock Dialog */}
        <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedChapter?.isLocked 
                  ? "Mở khóa chương" 
                  : "Khóa chương"}
              </DialogTitle>
              <DialogDescription>
                {selectedChapter?.isLocked 
                  ? "Chương sẽ được mở khóa và miễn phí cho tất cả người dùng." 
                  : "Người dùng sẽ cần trả xu để đọc chương này."}
              </DialogDescription>
            </DialogHeader>
            
            {selectedChapter && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">
                      {selectedChapter.title || `Chương ${selectedChapter.number}`}
                    </h4>
                    <p className="text-sm text-muted-foreground">Truyện: {content.title}</p>
                  </div>
                  <div>
                    <Switch
                      id="toggle-lock"
                      checked={!selectedChapter.isLocked}
                      onCheckedChange={(checked) => {
                        setSelectedChapter({...selectedChapter, isLocked: !checked});
                      }}
                    />
                  </div>
                </div>
                
                <Separator />
                
                {!selectedChapter.isLocked && (
                  <div className="space-y-2">
                    <Label htmlFor="unlock-price">Giá để mở khóa (xu)</Label>
                    <Input 
                      id="unlock-price"
                      type="number"
                      value={selectedChapter.unlockPrice || 0}
                      onChange={(e) => {
                        setSelectedChapter({
                          ...selectedChapter, 
                          unlockPrice: parseInt(e.target.value, 10)
                        });
                      }}
                      min={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Giá đề xuất: 10-30 xu cho chương thường, 30-50 xu cho chương đặc biệt.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLockDialog(false)}>
                Hủy
              </Button>
              <Button 
                onClick={() => {
                  if (selectedChapter) {
                    updateLockStatusMutation.mutate({
                      chapterId: selectedChapter.id,
                      isLocked: !selectedChapter.isLocked,
                      unlockPrice: selectedChapter.unlockPrice
                    });
                  }
                }}
                disabled={updateLockStatusMutation.isPending}
              >
                {updateLockStatusMutation.isPending ? (
                  <>
                    <span className="mr-2">Đang xử lý</span>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  </>
                ) : (
                  selectedChapter?.isLocked ? "Xác nhận mở khóa" : "Xác nhận khóa"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa chương</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này không thể khôi phục. Chương và tất cả nội dung của nó sẽ bị xóa vĩnh viễn.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleteChapterMutation.isPending ? (
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