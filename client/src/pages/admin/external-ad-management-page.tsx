import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2,
  Code,
  Globe,
  MonitorSmartphone,
  Layout,
  AlertCircle
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalAdFormDialog } from "@/components/admin/external-ad-form-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Define external ad interface
interface ExternalAd {
  id: number;
  name: string;
  provider: string;
  position: string;
  scriptContent: string;
  containerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  height?: number;
  width?: number;
  displayOrder?: number;
  startDate?: string;
  endDate?: string;
  isMobileEnabled: boolean;
}

export function ExternalAdManagementPage() {
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("active");
  const { toast } = useToast();
  
  // Form dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<ExternalAd | null>(null);
  
  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAdId, setDeletingAdId] = useState<number | null>(null);

  // Fetch external ads
  const { data, isLoading, isError } = useQuery({ 
    queryKey: ['/api/external-ads'],
    queryFn: async () => {
      return apiRequest.get('/api/external-ads');
    },
  });

  // Delete ad mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest.delete(`/api/external-ads/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Xóa quảng cáo thành công",
        description: "Quảng cáo đã được xóa khỏi hệ thống",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/external-ads'] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa quảng cáo. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
  });

  // Update ad status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number, isActive: boolean }) => {
      return apiRequest.patch(`/api/external-ads/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/external-ads'] });
      toast({
        title: "Cập nhật trạng thái thành công",
        description: "Trạng thái quảng cáo đã được cập nhật",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái quảng cáo",
        variant: "destructive",
      });
    },
  });

  // Filter and sort ads
  const filteredAds = data?.ads?.filter((ad: ExternalAd) => {
    const matchesSearch = search === "" || 
      ad.name.toLowerCase().includes(search.toLowerCase()) || 
      ad.provider.toLowerCase().includes(search.toLowerCase());
    
    const matchesPosition = positionFilter === "all" || ad.position === positionFilter;
    const matchesProvider = providerFilter === "all" || ad.provider === providerFilter;
    const matchesActive = activeTab === "all" || 
      (activeTab === "active" && ad.isActive) || 
      (activeTab === "inactive" && !ad.isActive);
    
    return matchesSearch && matchesPosition && matchesProvider && matchesActive;
  }) || [];

  // Handle delete button click
  const handleDeleteClick = (id: number) => {
    setDeletingAdId(id);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deletingAdId) {
      deleteMutation.mutate(deletingAdId);
    }
  };

  // Handle toggle status
  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    updateStatusMutation.mutate({ id, isActive: !currentStatus });
  };

  // Handle edit button click
  const handleEditClick = (ad: ExternalAd) => {
    setEditingAd(ad);
    setIsFormOpen(true);
  };

  // Handle add new button click
  const handleAddNewClick = () => {
    setEditingAd(null);
    setIsFormOpen(true);
  };

  // Close form dialog
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAd(null);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Quản lý quảng cáo bên thứ 3</CardTitle>
              <CardDescription>
                Quản lý các script quảng cáo từ các nhà cung cấp quảng cáo bên thứ 3 như Google AdSense, Facebook Ads
              </CardDescription>
            </div>
            <Button onClick={handleAddNewClick}>
              <Plus className="h-4 w-4 mr-1" />
              Thêm mới
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 flex-1 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm quảng cáo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger className="max-w-[180px]">
                    <SelectValue placeholder="Vị trí" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả vị trí</SelectItem>
                    <SelectItem value="top">Đầu trang</SelectItem>
                    <SelectItem value="bottom">Cuối trang</SelectItem>
                    <SelectItem value="left">Bên trái</SelectItem>
                    <SelectItem value="right">Bên phải</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                    <SelectItem value="overlay">Lớp phủ</SelectItem>
                    <SelectItem value="custom">Tùy chỉnh</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={providerFilter} onValueChange={setProviderFilter}>
                  <SelectTrigger className="max-w-[180px]">
                    <SelectValue placeholder="Nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả nhà cung cấp</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
                <TabsTrigger value="inactive">Không hoạt động</TabsTrigger>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-opacity-50 border-t-primary rounded-full"></div>
                  </div>
                ) : isError ? (
                  <div className="flex justify-center p-8 text-destructive">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>Lỗi khi tải dữ liệu. Vui lòng thử lại.</span>
                  </div>
                ) : filteredAds.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    Không tìm thấy quảng cáo nào phù hợp với bộ lọc
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Tên</TableHead>
                          <TableHead>Vị trí</TableHead>
                          <TableHead>Nhà cung cấp</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAds.map((ad: ExternalAd) => (
                          <TableRow key={ad.id}>
                            <TableCell className="font-medium">{ad.id}</TableCell>
                            <TableCell>{ad.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                <Layout className="h-3 w-3 mr-1" />
                                {ad.position === 'top' && 'Đầu trang'}
                                {ad.position === 'bottom' && 'Cuối trang'}
                                {ad.position === 'left' && 'Bên trái'}
                                {ad.position === 'right' && 'Bên phải'}
                                {ad.position === 'popup' && 'Popup'}
                                {ad.position === 'overlay' && 'Lớp phủ'}
                                {ad.position === 'custom' && 'Tùy chỉnh'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                <Globe className="h-3 w-3 mr-1" />
                                {ad.provider === 'google' && 'Google'}
                                {ad.provider === 'facebook' && 'Facebook'}
                                {ad.provider === 'other' && 'Khác'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={ad.isActive}
                                  onCheckedChange={() => handleToggleStatus(ad.id, ad.isActive)}
                                  id={`status-switch-${ad.id}`}
                                />
                                <Label htmlFor={`status-switch-${ad.id}`}>
                                  {ad.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                </Label>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditClick(ad)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Sửa</span>
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteClick(ad.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Xóa</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* External Ad Form Dialog */}
      <ExternalAdFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        ad={editingAd}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa quảng cáo</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa quảng cáo này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}