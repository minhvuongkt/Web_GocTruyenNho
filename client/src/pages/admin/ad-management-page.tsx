import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdFormDialog } from '@/components/admin/ad-form-dialog';
import { ExternalAdFormDialog } from '@/components/admin/external-ad-form-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Plus, RefreshCw, Search } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { format } from 'date-fns';
import { ExternalAdConfig } from '@/components/ads/external-ad';
import { Advertisement } from '@/components/ads/ad-context';

export function AdManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('regular');

  // State for regular ads
  const [adPage, setAdPage] = useState(1);
  const [adLimit, setAdLimit] = useState(10);
  const [adStatus, setAdStatus] = useState<string | null>(null);
  const [adPosition, setAdPosition] = useState<string | null>(null);
  const [adSearchTerm, setAdSearchTerm] = useState('');
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [adDialogOpen, setAdDialogOpen] = useState(false);

  // State for external ads
  const [externalPage, setExternalPage] = useState(1);
  const [externalLimit, setExternalLimit] = useState(10);
  const [externalStatus, setExternalStatus] = useState<string | null>(null);
  const [externalPosition, setExternalPosition] = useState<string | null>(null);
  const [externalProvider, setExternalProvider] = useState<string | null>(null);
  const [externalSearchTerm, setExternalSearchTerm] = useState('');
  const [selectedExternalAd, setSelectedExternalAd] = useState<ExternalAdConfig | null>(null);
  const [externalDialogOpen, setExternalDialogOpen] = useState(false);

  // Query for regular ads
  const { 
    data: adData, 
    isLoading: isLoadingAds, 
    refetch: refetchAds 
  } = useQuery({
    queryKey: ['/api/ads', adPage, adLimit, adStatus, adPosition, adSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', adPage.toString());
      params.append('limit', adLimit.toString());
      if (adStatus) params.append('status', adStatus);
      if (adPosition && adPosition !== 'all') params.append('position', adPosition);
      if (adSearchTerm) params.append('search', adSearchTerm);
      
      return apiRequest('GET', `/api/ads?${params.toString()}`);
    },
    enabled: activeTab === 'regular'
  });

  // Query for external ads
  const { 
    data: externalData, 
    isLoading: isLoadingExternalAds, 
    refetch: refetchExternalAds 
  } = useQuery({
    queryKey: ['/api/external-ads', externalPage, externalLimit, externalStatus, externalPosition, externalProvider, externalSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', externalPage.toString());
      params.append('limit', externalLimit.toString());
      if (externalStatus) params.append('status', externalStatus);
      if (externalPosition && externalPosition !== 'all') params.append('position', externalPosition);
      if (externalProvider && externalProvider !== 'all') params.append('provider', externalProvider);
      if (externalSearchTerm) params.append('search', externalSearchTerm);
      
      return apiRequest('GET', `/api/external-ads?${params.toString()}`);
    },
    enabled: activeTab === 'external'
  });

  // Mutation for deleting regular ads
  const deleteAdMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/ads/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Xóa quảng cáo thành công',
        description: 'Quảng cáo đã được xóa khỏi hệ thống.',
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ads/active'] });
    },
    onError: (error) => {
      toast({
        title: 'Lỗi khi xóa quảng cáo',
        description: 'Không thể xóa quảng cáo. Vui lòng thử lại sau.',
        variant: 'destructive'
      });
      console.error('Delete ad error:', error);
    }
  });

  // Mutation for deleting external ads
  const deleteExternalAdMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/external-ads/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Xóa quảng cáo thứ ba thành công',
        description: 'Quảng cáo đã được xóa khỏi hệ thống.',
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/external-ads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/external-ads/active'] });
    },
    onError: (error) => {
      toast({
        title: 'Lỗi khi xóa quảng cáo thứ ba',
        description: 'Không thể xóa quảng cáo. Vui lòng thử lại sau.',
        variant: 'destructive'
      });
      console.error('Delete external ad error:', error);
    }
  });

  // Handler for deleting a regular ad
  const handleDeleteAd = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa quảng cáo này không?')) {
      deleteAdMutation.mutate(id);
    }
  };

  // Handler for deleting an external ad
  const handleDeleteExternalAd = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa quảng cáo thứ ba này không?')) {
      deleteExternalAdMutation.mutate(id);
    }
  };

  // Handler for editing a regular ad
  const handleEditAd = (ad: Advertisement) => {
    setSelectedAd(ad);
    setAdDialogOpen(true);
  };

  // Handler for editing an external ad
  const handleEditExternalAd = (ad: ExternalAdConfig) => {
    setSelectedExternalAd(ad);
    setExternalDialogOpen(true);
  };

  // Reset filters for regular ads
  const resetAdFilters = () => {
    setAdStatus(null);
    setAdPosition(null);
    setAdSearchTerm('');
    setAdPage(1);
  };

  // Reset filters for external ads
  const resetExternalFilters = () => {
    setExternalStatus(null);
    setExternalPosition(null);
    setExternalProvider(null);
    setExternalSearchTerm('');
    setExternalPage(1);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Trigger refetch when switching tabs
    if (value === 'regular') {
      setTimeout(() => refetchAds(), 100);
    } else if (value === 'external') {
      setTimeout(() => refetchExternalAds(), 100);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Quản lý Quảng cáo</h1>
        </div>

        <Tabs defaultValue="regular" onValueChange={handleTabChange} className="mb-6">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="regular" className="flex-1">Quảng cáo Thủ công</TabsTrigger>
            <TabsTrigger value="external" className="flex-1">Quảng cáo Bên thứ 3</TabsTrigger>
          </TabsList>

          {/* Regular Ads Tab */}
          <TabsContent value="regular">
            <Card className="p-6">
              <div className="flex justify-between mb-6">
                <div className="text-xl font-semibold">Danh sách quảng cáo thủ công</div>
                <Button onClick={() => { setSelectedAd(null); setAdDialogOpen(true); }}>
                  <Plus size={16} className="mr-2" /> Thêm quảng cáo mới
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Tìm kiếm theo tiêu đề..."
                    value={adSearchTerm}
                    onChange={(e) => setAdSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={adPosition || "all"}
                  onValueChange={(value) => setAdPosition(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Vị trí" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả vị trí</SelectItem>
                    <SelectItem value="top">Đầu trang</SelectItem>
                    <SelectItem value="bottom">Cuối trang</SelectItem>
                    <SelectItem value="left">Trái</SelectItem>
                    <SelectItem value="right">Phải</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                    <SelectItem value="overlay">Overlay</SelectItem>
                    <SelectItem value="custom">Tùy chỉnh</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={adStatus || "all"}
                  onValueChange={(value) => setAdStatus(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="active">Đang hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => refetchAds()} title="Làm mới dữ liệu">
                    <RefreshCw size={16} />
                  </Button>
                  <Button variant="outline" onClick={resetAdFilters} title="Đặt lại bộ lọc">
                    <RefreshCw size={16} />
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Hình ảnh</TableHead>
                      <TableHead>URL đích</TableHead>
                      <TableHead>Vị trí</TableHead>
                      <TableHead>Lượt xem</TableHead>
                      <TableHead>Lượt click</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingAds ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-4">
                          Đang tải...
                        </TableCell>
                      </TableRow>
                    ) : adData?.ads && adData.ads.length > 0 ? (
                      adData.ads.map((ad: Advertisement) => (
                        <TableRow key={ad.id}>
                          <TableCell className="font-medium">{ad.id}</TableCell>
                          <TableCell>{ad.title}</TableCell>
                          <TableCell>
                            <img src={ad.imageUrl} alt={ad.title} className="w-16 h-12 object-cover" />
                          </TableCell>
                          <TableCell className="truncate max-w-[150px]">{ad.targetUrl}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ad.position}</Badge>
                          </TableCell>
                          <TableCell>{ad.views || 0}</TableCell>
                          <TableCell>{ad.clicks || 0}</TableCell>
                          <TableCell>
                            <Badge variant={ad.isActive ? "success" : "secondary"}>
                              {ad.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditAd(ad)}>
                                <Edit size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteAd(ad.id)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-4">
                          Không tìm thấy quảng cáo nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {adData?.total && adData.total > 0 && (
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    Hiển thị {adPage * adLimit - adLimit + 1} đến {Math.min(adPage * adLimit, adData.total)} trong tổng số {adData.total} quảng cáo
                  </div>
                  <Pagination
                    currentPage={adPage}
                    totalPages={Math.ceil(adData.total / adLimit)}
                    onPageChange={setAdPage}
                  />
                </div>
              )}
            </Card>

            {/* Regular Ad Form Dialog */}
            <AdFormDialog
              open={adDialogOpen}
              onOpenChange={setAdDialogOpen}
              ad={selectedAd}
              onSuccess={() => {
                setAdDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['/api/ads'] });
                queryClient.invalidateQueries({ queryKey: ['/api/ads/active'] });
              }}
            />
          </TabsContent>

          {/* External Ads Tab */}
          <TabsContent value="external">
            <Card className="p-6">
              <div className="flex justify-between mb-6">
                <div className="text-xl font-semibold">Danh sách quảng cáo bên thứ 3</div>
                <Button onClick={() => { setSelectedExternalAd(null); setExternalDialogOpen(true); }}>
                  <Plus size={16} className="mr-2" /> Thêm quảng cáo bên thứ 3
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Tìm kiếm theo tên..."
                    value={externalSearchTerm}
                    onChange={(e) => setExternalSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={externalProvider || "all"}
                  onValueChange={(value) => setExternalProvider(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả nhà cung cấp</SelectItem>
                    <SelectItem value="google">Google AdSense</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={externalPosition || "all"}
                  onValueChange={(value) => setExternalPosition(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Vị trí" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả vị trí</SelectItem>
                    <SelectItem value="top">Đầu trang</SelectItem>
                    <SelectItem value="bottom">Cuối trang</SelectItem>
                    <SelectItem value="left">Trái</SelectItem>
                    <SelectItem value="right">Phải</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                    <SelectItem value="overlay">Overlay</SelectItem>
                    <SelectItem value="custom">Tùy chỉnh</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={externalStatus || "all"}
                  onValueChange={(value) => setExternalStatus(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="active">Đang hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => refetchExternalAds()} title="Làm mới dữ liệu">
                    <RefreshCw size={16} />
                  </Button>
                  <Button variant="outline" onClick={resetExternalFilters} title="Đặt lại bộ lọc">
                    <RefreshCw size={16} />
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead>Nhà cung cấp</TableHead>
                      <TableHead>Vị trí</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Ngày cập nhật</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingExternalAds ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          Đang tải...
                        </TableCell>
                      </TableRow>
                    ) : externalData?.ads && externalData.ads.length > 0 ? (
                      externalData.ads.map((ad: ExternalAdConfig) => (
                        <TableRow key={ad.id}>
                          <TableCell className="font-medium">{ad.id}</TableCell>
                          <TableCell>{ad.name}</TableCell>
                          <TableCell>{ad.provider}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ad.position}</Badge>
                          </TableCell>
                          <TableCell>
                            {ad.createdAt ? format(new Date(ad.createdAt), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            {ad.updatedAt ? format(new Date(ad.updatedAt), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={ad.isActive ? "success" : "secondary"}>
                              {ad.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditExternalAd(ad)}>
                                <Edit size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteExternalAd(ad.id)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          Không tìm thấy quảng cáo bên thứ 3 nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {externalData?.total && externalData.total > 0 && (
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    Hiển thị {externalPage * externalLimit - externalLimit + 1} đến {Math.min(externalPage * externalLimit, externalData.total)} trong tổng số {externalData.total} quảng cáo
                  </div>
                  <Pagination
                    currentPage={externalPage}
                    totalPages={Math.ceil(externalData.total / externalLimit)}
                    onPageChange={setExternalPage}
                  />
                </div>
              )}
            </Card>

            {/* External Ad Form Dialog */}
            <ExternalAdFormDialog
              open={externalDialogOpen}
              onOpenChange={setExternalDialogOpen}
              ad={selectedExternalAd}
              onSuccess={() => {
                setExternalDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['/api/external-ads'] });
                queryClient.invalidateQueries({ queryKey: ['/api/external-ads/active'] });
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}