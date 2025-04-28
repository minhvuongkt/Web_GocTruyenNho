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
  Image
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatCurrency } from "@/lib/utils";

export function AdManagementPage() {
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("active");
  
  // Fetch advertisements
  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/advertisements", activeTab, positionFilter],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // For now, we'll return mock data
      const allAds = [
        { 
          id: 1, 
          title: "Premium Membership Promotion", 
          imageUrl: "https://via.placeholder.com/800x100?text=Premium+Membership", 
          targetUrl: "https://example.com/premium", 
          position: "banner",
          startDate: "2023-06-01T00:00:00Z",
          endDate: "2023-08-31T23:59:59Z",
          isActive: true,
          views: 15432,
          clicks: 423,
          createdAt: "2023-05-25T10:00:00Z"
        },
        { 
          id: 2, 
          title: "New Manga Collection", 
          imageUrl: "https://via.placeholder.com/300x600?text=New+Manga+Collection", 
          targetUrl: "https://example.com/manga-collection", 
          position: "sidebar",
          startDate: "2023-07-01T00:00:00Z",
          endDate: "2023-07-31T23:59:59Z",
          isActive: true,
          views: 8765,
          clicks: 321,
          createdAt: "2023-06-25T09:30:00Z"
        },
        { 
          id: 3, 
          title: "Mobile App Download", 
          imageUrl: "https://via.placeholder.com/400x300?text=Mobile+App+Download", 
          targetUrl: "https://example.com/mobile-app", 
          position: "popup",
          startDate: "2023-07-15T00:00:00Z",
          endDate: "2023-08-15T23:59:59Z",
          isActive: true,
          views: 5421,
          clicks: 198,
          createdAt: "2023-07-10T14:45:00Z"
        },
        { 
          id: 4, 
          title: "Summer Sale", 
          imageUrl: "https://via.placeholder.com/800x100?text=Summer+Sale", 
          targetUrl: "https://example.com/summer-sale", 
          position: "banner",
          startDate: "2023-06-15T00:00:00Z",
          endDate: "2023-06-30T23:59:59Z",
          isActive: false,
          views: 12543,
          clicks: 567,
          createdAt: "2023-06-10T11:20:00Z"
        },
        { 
          id: 5, 
          title: "Fantasy Novel Collection", 
          imageUrl: "https://via.placeholder.com/300x600?text=Fantasy+Novel+Collection", 
          targetUrl: "https://example.com/fantasy-novels", 
          position: "sidebar",
          startDate: "2023-08-01T00:00:00Z",
          endDate: "2023-09-30T23:59:59Z",
          isActive: false,
          views: 0,
          clicks: 0,
          createdAt: "2023-07-20T16:35:00Z"
        }
      ];
      
      // Filter by active status
      const filteredByStatus = activeTab === "all" 
        ? allAds 
        : allAds.filter(ad => (activeTab === "active" ? ad.isActive : !ad.isActive));
      
      // Filter by position
      const filteredByPosition = positionFilter === "all"
        ? filteredByStatus
        : filteredByStatus.filter(ad => ad.position === positionFilter);
      
      return {
        ads: filteredByPosition,
        total: filteredByPosition.length
      };
    }
  });

  // Filter ads based on search term
  const filteredAds = data?.ads.filter(ad => 
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
          <Button>
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
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Pencil className="h-4 w-4" />
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
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

export default AdManagementPage;