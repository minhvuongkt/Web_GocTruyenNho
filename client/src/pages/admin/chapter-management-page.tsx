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
  const [showChapterSelect, setShowChapterSelect] = useState(false);
  const [relativeChapter, setRelativeChapter] = useState<number | null>(null);
  const [relativePosition, setRelativePosition] = useState<string>("after");
  const [chapterImages, setChapterImages] = useState<File[]>([]);
  
  // State cho form thêm chương
  const [newChapter, setNewChapter] = useState({
    contentId,
    number: 0,
    title: "",
    isLocked: false,
    unlockPrice: 0,
    content: "",
    releaseDate: new Date().toISOString().split('T')[0]
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
        unlockPrice: 0,
        content: "",
        releaseDate: new Date().toISOString().split('T')[0]
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
  
  // Mutation cập nhật chương
  const updateChapterMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/chapters/${data.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật chương thành công",
        description: "Chương đã được cập nhật",
      });
      
      setIsEditDialogOpen(false);
      
      // Refresh danh sách chương
      queryClient.invalidateQueries({ queryKey: [`/api/content/${contentId}/chapters`] });
    },
    onError: (error) => {
      toast({
        title: "Không thể cập nhật chương",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi cập nhật chương",
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
  
  // Xử lý tải ảnh lên
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      // Kiểm tra kích thước file và loại file
      const validFiles = newFiles.filter(file => {
        const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
        if (!isValidType) {
          toast({
            title: "Loại file không hợp lệ",
            description: `${file.name} không phải là định dạng JPG, PNG hoặc WEBP`,
            variant: "destructive",
          });
        }
        if (!isValidSize) {
          toast({
            title: "File quá lớn",
            description: `${file.name} vượt quá giới hạn 5MB`,
            variant: "destructive",
          });
        }
        return isValidType && isValidSize;
      });
      
      setChapterImages(prev => [...prev, ...validFiles]);
    }
  };
  
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
  
  // Chuẩn bị FormData để gửi ảnh
  const prepareChapterFormData = async (): Promise<FormData | null> => {
    if (content?.type !== 'manga' || chapterImages.length === 0) {
      return null;
    }
    
    const formData = new FormData();
    
    // Thêm thông tin chương
    formData.append('contentId', newChapter.contentId.toString());
    formData.append('number', newChapter.number.toString());
    formData.append('title', newChapter.title);
    formData.append('isLocked', newChapter.isLocked.toString());
    formData.append('unlockPrice', newChapter.unlockPrice.toString());
    formData.append('releaseDate', newChapter.releaseDate);
    
    // Thêm ảnh
    chapterImages.forEach((file, index) => {
      formData.append('images', file);
      formData.append('imageNames', `image_${index+1}.${file.name.split('.').pop()}`);
    });
    
    return formData;
  };
  
  // Mutation tải ảnh lên
  const uploadChapterImagesMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/chapters/images/upload', {
        method: 'POST',
        body: formData,
        // Không cần headers khi gửi FormData
      });
      
      if (!response.ok) {
        throw new Error('Lỗi khi tải ảnh lên');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Cập nhật nội dung chương với đường dẫn ảnh đã tải lên
      if (data.imageUrls && data.imageUrls.length > 0) {
        const imageContent = data.imageUrls.map((url: string) => 
          `<img src="${url}" alt="Trang truyện" class="manga-page" />`
        ).join('\n');
        
        // Gửi dữ liệu chương với nội dung ảnh
        createChapterMutation.mutate({
          ...newChapter,
          content: imageContent
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Lỗi khi tải ảnh lên",
        description: error instanceof Error ? error.message : "Không thể tải ảnh lên server",
        variant: "destructive",
      });
    }
  });

  // Xử lý form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (content?.type === 'manga' && chapterImages.length === 0) {
      toast({
        title: "Thiếu ảnh",
        description: "Vui lòng tải lên ít nhất một ảnh cho chương truyện tranh",
        variant: "destructive",
      });
      return;
    }
    
    // Nếu là truyện tranh, xử lý tải ảnh và tạo nội dung
    if (content?.type === 'manga') {
      const formData = await prepareChapterFormData();
      if (formData) {
        toast({
          title: "Đang tải ảnh lên",
          description: `Đang xử lý ${chapterImages.length} ảnh cho chương mới...`,
        });
        
        // Xử lý tải ảnh (trong môi trường thực tế)
        // uploadChapterImagesMutation.mutate(formData);
        
        // Hiện tại chỉ mô phỏng bằng cách gửi trực tiếp dữ liệu chương
        createChapterMutation.mutate(newChapter);
        return;
      }
    }
    
    // Đối với truyện chữ, gửi trực tiếp
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
              onClick={() => setLocation('/admin/manga')}
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
              onClick={() => setLocation('/admin/manga')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách truyện
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý chương: {content.title}</h1>
            <p className="text-muted-foreground mt-1">
              Loại: {content?.type === 'manga' ? 'Truyện tranh' : 'Truyện chữ'} | 
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
                    <Label htmlFor="insertType" className="text-right">Vị trí chèn</Label>
                    <div className="col-span-3">
                      <Select
                        name="insertType"
                        value="end"
                        onValueChange={(value) => {
                          if (value === "specific") {
                            setShowChapterSelect(true);
                          } else {
                            setShowChapterSelect(false);
                            if (value === "start") {
                              setNewChapter(prev => ({
                                ...prev,
                                number: 1
                              }));
                            } else if (value === "end" && chapters?.length > 0) {
                              setNewChapter(prev => ({
                                ...prev,
                                number: (chapters[chapters.length - 1]?.number || 0) + 1
                              }));
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Chọn vị trí chèn" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="start">Đầu truyện (Chương 1)</SelectItem>
                          <SelectItem value="end">Cuối truyện</SelectItem>
                          <SelectItem value="specific">Chèn trước/sau chương cụ thể</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {showChapterSelect && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="relativeChapter" className="text-right">Chọn chương</Label>
                        <div className="col-span-3">
                          <Select
                            name="relativeChapter"
                            value=""
                            onValueChange={(value) => {
                              setRelativeChapter(parseInt(value));
                            }}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Chọn chương tham chiếu" />
                            </SelectTrigger>
                            <SelectContent>
                              {chapters && chapters.map((chapter: any) => (
                                <SelectItem key={chapter.id} value={chapter.number.toString()}>
                                  Chương {chapter.number}{chapter.title ? `: ${chapter.title}` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="relativePosition" className="text-right">Vị trí</Label>
                        <div className="col-span-3">
                          <Select
                            name="relativePosition"
                            value="after"
                            onValueChange={(value) => {
                              setRelativePosition(value);
                              if (relativeChapter) {
                                if (value === "before") {
                                  setNewChapter(prev => ({
                                    ...prev,
                                    number: relativeChapter
                                  }));
                                } else {
                                  setNewChapter(prev => ({
                                    ...prev,
                                    number: relativeChapter + 1
                                  }));
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Chọn vị trí" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="before">Chèn trước chương đã chọn</SelectItem>
                              <SelectItem value="after">Chèn sau chương đã chọn</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                  
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
                  {content?.type === 'manga' ? (
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">Tải ảnh lên</Label>
                      <div className="col-span-3 space-y-4">
                        <div className="flex space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.multiple = true;
                              input.accept = 'image/jpeg,image/png,image/webp';
                              input.onchange = (e) => handleImageUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
                              input.click();
                            }}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Tải ảnh lên
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = '.zip';
                              input.onchange = (e) => {
                                // Handle ZIP upload
                                if (e.target && (e.target as HTMLInputElement).files && (e.target as HTMLInputElement).files!.length > 0) {
                                  const file = (e.target as HTMLInputElement).files![0];
                                  toast({
                                    title: "Tính năng đang phát triển",
                                    description: `Tải lên file ZIP sẽ được hỗ trợ trong bản cập nhật tới`,
                                  });
                                }
                              };
                              input.click();
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Tải file ZIP
                          </Button>
                        </div>
                        
                        <div
                          className="border-2 border-dashed border-muted-foreground rounded-md p-4 text-center min-h-[200px] flex flex-col items-center justify-center bg-muted/30 relative hover:bg-muted/40 transition-colors"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.add('bg-muted/50');
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('bg-muted/50');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('bg-muted/50');
                            
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              const files = Array.from(e.dataTransfer.files);
                              const imageFiles = files.filter(file => 
                                ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
                              );
                              
                              if (imageFiles.length > 0) {
                                const changeEvent = {
                                  target: {
                                    files: Object.assign([], imageFiles)
                                  }
                                } as unknown as React.ChangeEvent<HTMLInputElement>;
                                
                                handleImageUpload(changeEvent);
                                toast({
                                  title: "Tải lên thành công",
                                  description: `Đã thêm ${imageFiles.length} ảnh vào chương`,
                                });
                              } else {
                                toast({
                                  title: "Không có ảnh hợp lệ",
                                  description: "Vui lòng tải lên file JPG, PNG hoặc WEBP",
                                  variant: "destructive"
                                });
                              }
                            }
                          }}
                        >
                          {chapterImages.length > 0 ? (
                            <div className="w-full">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium">Ảnh đã chọn ({chapterImages.length})</h4>
                                <div className="flex gap-2">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                      // Sắp xếp ảnh theo tên file
                                      setChapterImages(prev => [...prev].sort((a, b) => 
                                        a.name.localeCompare(b.name, undefined, {numeric: true})
                                      ));
                                      toast({
                                        title: "Đã sắp xếp ảnh",
                                        description: "Ảnh đã được sắp xếp theo tên file",
                                      });
                                    }}
                                  >
                                    <SortAsc className="h-3 w-3 mr-1" />
                                    Sắp xếp
                                  </Button>
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setChapterImages([])}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Xóa tất cả
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                {chapterImages.map((file, index) => (
                                  <div key={index} className="relative aspect-[2/3] bg-muted rounded-md overflow-hidden group">
                                    <img 
                                      src={URL.createObjectURL(file)} 
                                      alt={`Trang ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="text-white"
                                        onClick={() => {
                                          setChapterImages(prev => prev.filter((_, i) => i !== index));
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center truncate">
                                      {index + 1}. {file.name.split('.')[0]}
                                    </span>
                                  </div>
                                ))}
                                
                                {/* Nút thêm ảnh */}
                                <div 
                                  className="aspect-[2/3] bg-muted/40 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors border-2 border-dashed border-muted-foreground"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.multiple = true;
                                    input.accept = 'image/jpeg,image/png,image/webp';
                                    input.onchange = (e) => handleImageUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
                                    input.click();
                                  }}
                                >
                                  <div className="flex flex-col items-center gap-2">
                                    <Plus className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">Thêm ảnh</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground mb-2">Kéo thả ảnh vào đây hoặc nhấn nút để tải lên</p>
                              <p className="text-xs text-muted-foreground">Hỗ trợ: JPG, PNG, WEBP (Tối đa 5MB mỗi ảnh)</p>
                            </>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p>Lưu ý: Ảnh sẽ được sắp xếp theo thứ tự tải lên. Bạn có thể kéo thả để thay đổi thứ tự.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="content" className="text-right pt-2">Nội dung chương</Label>
                      <div className="col-span-3 space-y-2">
                        <div className="flex justify-between mb-2">
                          <div className="space-x-1">
                            <Button type="button" variant="outline" size="sm">B</Button>
                            <Button type="button" variant="outline" size="sm">I</Button>
                            <Button type="button" variant="outline" size="sm">U</Button>
                          </div>
                          <div className="space-x-1">
                            <Button type="button" variant="outline" size="sm">H1</Button>
                            <Button type="button" variant="outline" size="sm">H2</Button>
                            <Button type="button" variant="outline" size="sm">H3</Button>
                          </div>
                          <div className="space-x-1">
                            <Button type="button" variant="outline" size="sm">
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          id="content"
                          name="content"
                          rows={12}
                          value={newChapter.content}
                          onChange={handleInputChange}
                          placeholder="Nhập nội dung chương (truyện chữ)"
                          required
                          className="font-mono text-sm"
                        />
                      </div>
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
                              <a href={`/truyen/${content.id}/chapter/${chapter.id}`} target="_blank">
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
                                setSelectedChapter({...chapter});
                                setIsEditDialogOpen(true);
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
        
        {/* Edit Chapter Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa chương</DialogTitle>
              <DialogDescription>
                Chỉnh sửa thông tin chương {selectedChapter?.number} của {content?.title}
              </DialogDescription>
            </DialogHeader>
            
            {selectedChapter && (
              <form onSubmit={(e) => {
                e.preventDefault();
                updateChapterMutation.mutate(selectedChapter);
              }}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="chapter-number" className="text-right">
                      Số chương
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="chapter-number"
                        name="number"
                        type="number"
                        value={selectedChapter.number}
                        onChange={(e) => setSelectedChapter({...selectedChapter, number: parseInt(e.target.value, 10)})}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="chapter-title" className="text-right">
                      Tiêu đề chương
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="chapter-title"
                        name="title"
                        type="text"
                        value={selectedChapter.title || ''}
                        onChange={(e) => setSelectedChapter({...selectedChapter, title: e.target.value})}
                        placeholder="Nhập tiêu đề chương"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="chapter-release-date" className="text-right">
                      Ngày phát hành
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="chapter-release-date"
                        name="releaseDate"
                        type="date"
                        value={
                          selectedChapter.releaseDate 
                            ? new Date(selectedChapter.releaseDate).toISOString().split('T')[0]
                            : new Date().toISOString().split('T')[0]
                        }
                        onChange={(e) => setSelectedChapter({...selectedChapter, releaseDate: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right flex items-center">
                      Trạng thái khóa
                    </Label>
                    <div className="col-span-3 flex items-center gap-2">
                      <Switch
                        id="chapter-lock"
                        checked={!selectedChapter.isLocked}
                        onCheckedChange={(checked) => {
                          setSelectedChapter({...selectedChapter, isLocked: !checked});
                        }}
                      />
                      <Label htmlFor="chapter-lock">
                        {selectedChapter.isLocked ? "Đã khóa" : "Công khai"}
                      </Label>
                    </div>
                  </div>
                  
                  {selectedChapter.isLocked && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="chapter-price" className="text-right">
                        Giá mở khóa (xu)
                      </Label>
                      <div className="col-span-3">
                        <Input
                          id="chapter-price"
                          name="unlockPrice"
                          type="number"
                          value={selectedChapter.unlockPrice || 0}
                          onChange={(e) => setSelectedChapter({...selectedChapter, unlockPrice: parseInt(e.target.value, 10)})}
                          min="1"
                        />
                      </div>
                    </div>
                  )}
                  
                  {content?.type === 'novel' && (
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="chapter-content" className="text-right pt-2">
                        Nội dung
                      </Label>
                      <div className="col-span-3">
                        <div className="border rounded-md p-1 mb-2">
                          <div className="flex gap-1 mb-2">
                            <Button type="button" variant="outline" size="sm">B</Button>
                            <Button type="button" variant="outline" size="sm">I</Button>
                            <Button type="button" variant="outline" size="sm">U</Button>
                            <Separator orientation="vertical" className="mx-1 h-8" />
                            <Button type="button" variant="outline" size="sm">H1</Button>
                            <Button type="button" variant="outline" size="sm">H2</Button>
                            <Button type="button" variant="outline" size="sm">H3</Button>
                            <Separator orientation="vertical" className="mx-1 h-8" />
                            <Button type="button" variant="outline" size="sm">
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          id="chapter-content"
                          name="content"
                          value={selectedChapter.content || ''}
                          onChange={(e) => setSelectedChapter({...selectedChapter, content: e.target.value})}
                          placeholder="Nội dung chương"
                          className="h-[400px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={updateChapterMutation.isPending}>
                    {updateChapterMutation.isPending ? (
                      <>
                        <span className="mr-2">Đang lưu</span>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      </>
                    ) : (
                      "Lưu thay đổi"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
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