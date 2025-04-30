import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { normalizeId } from "@/lib/hashUtils";

// UI Components
import AdminLayout from "@/components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
        AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, 
        DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Icons
import { AlertTriangle, Plus, Pencil, Trash2, Search, Lock, Unlock, ArrowLeft } from "lucide-react";

export default function ChapterListPage({ contentId }: { contentId: number }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // State for searching and sorting
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: "number",
    direction: "asc"
  });
  
  // State for dialog controls
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<number | null>(null);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  
  // Query to fetch content details
  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: [`/api/content/${contentId}`],
    queryFn: async () => {
      const response = await fetch(`/api/content/${contentId}`);
      if (!response.ok) throw new Error('Không thể tải thông tin truyện');
      const data = await response.json();
      return data.content;
    },
    enabled: !!contentId
  });
  
  // Query to fetch chapters
  const { data: chaptersData, isLoading: chaptersLoading } = useQuery({
    queryKey: [`/api/content/${contentId}/chapters`],
    queryFn: async () => {
      const response = await fetch(`/api/content/${contentId}/chapters`);
      if (!response.ok) throw new Error('Không thể tải danh sách chương');
      return response.json();
    },
    enabled: !!contentId
  });
  
  const chapters = chaptersData || [];
  
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
  
  // Xử lý khóa/mở khóa chương
  const handleLockToggle = (chapter: any) => {
    setSelectedChapter(chapter);
    setShowLockDialog(true);
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
              onClick={() => navigate("/admin/manga")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách truyện
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý chương truyện</h1>
            <p className="text-muted-foreground">
              {content.title} - {content.type === 'manga' ? 'Truyện tranh' : 'Truyện chữ'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/admin/manga`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <Button onClick={() => navigate(`/admin/chapters/${contentId}/new`)}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm chương mới
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Danh sách chương</CardTitle>
            <CardDescription>
              Quản lý các chương của {content.title}.
              {chapters.length > 0 
                ? ` Hiện có ${chapters.length} chương.` 
                : ' Chưa có chương nào.'}
            </CardDescription>
            <div className="flex items-center gap-2 pt-4">
              <Search className="h-4 w-4 opacity-50" />
              <Input 
                placeholder="Tìm kiếm chương..." 
                className="flex-1" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="w-16 cursor-pointer"
                      onClick={() => sortData('number')}
                    >
                      #
                      {sortConfig.key === 'number' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => sortData('title')}
                    >
                      Tiêu đề
                      {sortConfig.key === 'title' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => sortData('releaseDate')}
                    >
                      Ngày phát hành
                      {sortConfig.key === 'releaseDate' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => sortData('viewCount')}
                    >
                      Lượt xem
                      {sortConfig.key === 'viewCount' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => sortData('isLocked')}
                    >
                      Trạng thái
                      {sortConfig.key === 'isLocked' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChapters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-32">
                        {chaptersLoading ? (
                          <div className="flex justify-center items-center h-full">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                          </div>
                        ) : search.length > 0 ? (
                          <div className="flex flex-col items-center justify-center h-full">
                            <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
                            <p>Không tìm thấy chương nào phù hợp với "{search}"</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full">
                            <p>Chưa có chương nào cho truyện này</p>
                            <Button 
                              className="mt-4" 
                              onClick={() => navigate(`/admin/chapters/${contentId}/new`)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Thêm chương đầu tiên
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredChapters.map((chapter: any) => (
                      <TableRow key={chapter.id}>
                        <TableCell className="font-medium">{chapter.number}</TableCell>
                        <TableCell>
                          <Link href={`/truyen/${content.id}/chapter/${chapter.id}`}
                            className="text-blue-600 hover:underline">
                              {chapter.title || `Chương ${chapter.number}`}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {new Date(chapter.releaseDate).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>{chapter.viewCount || 0}</TableCell>
                        <TableCell className="text-center">
                          {chapter.isLocked ? (
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 border-yellow-200">
                              <Lock className="mr-1 h-3 w-3" />
                              Khóa ({chapter.unlockPrice || 0} xu)
                            </div>
                          ) : (
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 border-green-200">
                              <Unlock className="mr-1 h-3 w-3" />
                              Công khai
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end items-center gap-2">
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
                              onClick={() => navigate(`/admin/chapters/${contentId}/chapter/${chapter.id}`)}
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