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
  Eye,
  Eye as ViewsIcon,
  MousePointer,
  Calendar,
  Image,
  AlertCircle
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AdvertisementFormDialog } from "@/components/admin/advertisement-form-dialog";
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

export function AdManagementPage() {
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("active");
  const { toast } = useToast();
  
  // Form dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentAd, setCurrentAd] = useState<any>(null);
  
  // Delete dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<number | null>(null);
  
  // Delete advertisement mutation
  const deleteAdMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/ads/${id}`);
      if (!response.ok) {
        throw new Error('Failed to delete advertisement');
      }
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Xóa thành công",
        description: "Quảng cáo đã được xóa khỏi hệ thống"
      });
      // Refresh ad list
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể xóa quảng cáo",
        variant: "destructive"
      });
    }
  });
  
  // Fetch advertisements
  const { data, isLoading } = useQuery({
    queryKey: ["/api/ads", activeTab, positionFilter],
    queryFn: async () => {
      try {
        // Construct query parameters
        const params = new URLSearchParams();
        
        if (positionFilter !== "all") {
          params.append("position", positionFilter);
        }
        
        if (activeTab !== "all") {
          params.append("status", activeTab === "active" ? "active" : "inactive");
        }
        
        // Add pagination parameters
        params.append("page", "1");
        params.append("limit", "20");
        
        // Make the API request
        const queryString = params.toString() ? `?${params.toString()}` : "";
        const response = await apiRequest("GET", `/api/ads${queryString}`);
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch advertisements:", error);
        return { ads: [], total: 0 };
      }
    }
  });

  // Filter ads based on search term
  const filteredAds = Array.isArray(data) 
    ? data.filter(ad => 
        ad.title.toLowerCase().includes(search.toLowerCase()) ||
        ad.targetUrl.toLowerCase().includes(search.toLowerCase())
      ) 
    : data?.ads?.filter(ad => 
        ad.title.toLowerCase().includes(search.toLowerCase()) ||
        ad.targetUrl.toLowerCase().includes(search.toLowerCase())
      ) || [];

  // Get position label
  const getPositionLabel = (position: string) => {
    switch (position) {
      case "banner":
        return "Banner";
      case "sidebar":
        return "Thanh bên";
      case "popup":
        return "Popup";
      default:
        return position;
    }
  };

  // Calculate CTR (Click-Through Rate)
  const calculateCTR = (views: number, clicks: number) => {
    if (views === 0) return "0%";
    return ((clicks / views) * 100).toFixed(2) + "%";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Quản lý quảng cáo</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm quảng cáo
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
            <TabsTrigger value="inactive">Tạm dừng</TabsTrigger>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách quảng cáo</CardTitle>
                <CardDescription>
                  Quản lý và theo dõi hiệu suất quảng cáo trên trang web
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm theo tiêu đề, URL..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  
                  <Select
                    value={positionFilter}
                    onValueChange={setPositionFilter}
                  >
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Vị trí" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả vị trí</SelectItem>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="sidebar">Thanh bên</SelectItem>
                      <SelectItem value="popup">Popup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quảng cáo</TableHead>
                        <TableHead>Vị trí</TableHead>
                        <TableHead>Thời gian</TableHead>
                        <TableHead className="text-right">Lượt hiển thị</TableHead>
                        <TableHead className="text-right">Lượt nhấp</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead className="text-center">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Đang tải dữ liệu...
                          </TableCell>
                        </TableRow>
                      ) : filteredAds.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Không tìm thấy dữ liệu
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAds.map((ad) => (
                          <TableRow key={ad.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                                  <img 
                                    src={ad.imageUrl} 
                                    alt={ad.title} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="font-medium">{ad.title}</div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {ad.targetUrl}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getPositionLabel(ad.position)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <div>Bắt đầu: {formatDate(ad.startDate)}</div>
                                <div>Kết thúc: {formatDate(ad.endDate)}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                <ViewsIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                                {ad.views.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                <MousePointer className="h-3 w-3 mr-1 text-muted-foreground" />
                                {ad.clicks.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {calculateCTR(ad.views, ad.clicks)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    window.open(ad.targetUrl, '_blank');
                                  }}
                                  title="Xem trang đích"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setCurrentAd(ad);
                                    setIsEditDialogOpen(true);
                                  }}
                                  title="Chỉnh sửa"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setAdToDelete(ad.id);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  title="Xóa"
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Advertisement Dialog */}
      <AdvertisementFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        mode="add"
      />

      {/* Edit Advertisement Dialog */}
      <AdvertisementFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        advertisement={currentAd}
        mode="edit"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa quảng cáo này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (adToDelete) {
                  deleteAdMutation.mutate(adToDelete);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

export default AdManagementPage;