import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function ExternalAdManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string | null>(null);
  const [position, setPosition] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAd, setSelectedAd] = useState<ExternalAdConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch external ads with filters
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/external-ads', page, limit, status, position, provider, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) params.append('status', status);
      if (position) params.append('position', position);
      if (provider) params.append('provider', provider);
      if (searchTerm) params.append('search', searchTerm);
      
      return apiRequest('GET', `/api/external-ads?${params.toString()}`);
    }
  });

  // Delete an external ad
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/external-ads/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Xóa thành công',
        description: 'Cấu hình quảng cáo bên thứ 3 đã được xóa.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/external-ads'] });
    },
    onError: (error) => {
      toast({
        title: 'Lỗi khi xóa',
        description: `Đã xảy ra lỗi: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
        variant: 'destructive',
      });
    }
  });

  // Toggle ad status
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest('PATCH', `/api/external-ads/${id}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: 'Cập nhật trạng thái thành công',
        description: 'Trạng thái quảng cáo đã được cập nhật.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/external-ads'] });
    },
    onError: (error) => {
      toast({
        title: 'Lỗi khi cập nhật trạng thái',
        description: `Đã xảy ra lỗi: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
        variant: 'destructive',
      });
    }
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa cấu hình quảng cáo này không?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (ad: ExternalAdConfig) => {
    setSelectedAd(ad);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedAd(null);
    setDialogOpen(true);
  };

  const resetFilters = () => {
    setPage(1);
    setStatus(null);
    setPosition(null);
    setProvider(null);
    setSearchTerm('');
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Không giới hạn';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return 'Ngày không hợp lệ';
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Quản lý quảng cáo bên thứ 3</h1>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus size={16} /> Thêm mới
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all" onClick={() => setStatus(null)}>
              Tất cả
            </TabsTrigger>
            <TabsTrigger value="active" onClick={() => setStatus('active')}>
              Đang kích hoạt
            </TabsTrigger>
            <TabsTrigger value="inactive" onClick={() => setStatus('inactive')}>
              Đã tắt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm theo tên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={position || ''} onValueChange={setPosition}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Vị trí" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tất cả vị trí</SelectItem>
                      <SelectItem value="top">Trên đầu</SelectItem>
                      <SelectItem value="bottom">Dưới chân</SelectItem>
                      <SelectItem value="left">Bên trái</SelectItem>
                      <SelectItem value="right">Bên phải</SelectItem>
                      <SelectItem value="popup">Popup</SelectItem>
                      <SelectItem value="overlay">Overlay</SelectItem>
                      <SelectItem value="custom">Tùy chỉnh</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={provider || ''} onValueChange={setProvider}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Nhà cung cấp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tất cả nhà cung cấp</SelectItem>
                      <SelectItem value="google">Google AdSense</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="coccoc">Cốc Cốc</SelectItem>
                      <SelectItem value="adtima">Adtima</SelectItem>
                      <SelectItem value="custom">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" onClick={resetFilters} title="Đặt lại bộ lọc">
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
                      <TableHead>Ngày bắt đầu</TableHead>
                      <TableHead>Ngày kết thúc</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          Đang tải...
                        </TableCell>
                      </TableRow>
                    ) : data?.ads && data.ads.length > 0 ? (
                      data.ads.map((ad: ExternalAdConfig) => (
                        <TableRow key={ad.id}>
                          <TableCell className="font-medium">{ad.id}</TableCell>
                          <TableCell>{ad.name}</TableCell>
                          <TableCell>{ad.provider}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {ad.position === 'top' && 'Trên đầu'}
                              {ad.position === 'bottom' && 'Dưới chân'}
                              {ad.position === 'left' && 'Bên trái'}
                              {ad.position === 'right' && 'Bên phải'}
                              {ad.position === 'popup' && 'Popup'}
                              {ad.position === 'overlay' && 'Overlay'}
                              {ad.position === 'custom' && 'Tùy chỉnh'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(ad.startDate)}</TableCell>
                          <TableCell>{formatDate(ad.endDate)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={ad.isActive ? "default" : "secondary"}
                              className="cursor-pointer"
                              onClick={() => toggleStatusMutation.mutate({ id: ad.id, isActive: !ad.isActive })}
                            >
                              {ad.isActive ? 'Đang kích hoạt' : 'Đã tắt'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(ad)}
                              className="mr-1"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(ad.id)}
                              className="text-destructive"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          Không có quảng cáo nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {data?.total && data.total > 0 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Hiển thị {((page - 1) * limit) + 1} - {Math.min(page * limit, data.total)} trên {data.total}
                  </div>
                  <Pagination
                    currentPage={page}
                    totalPages={Math.ceil(data.total / limit)}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="active" className="space-y-4">
            {/* Same content as "all" tab but with active filter */}
          </TabsContent>
          
          <TabsContent value="inactive" className="space-y-4">
            {/* Same content as "all" tab but with inactive filter */}
          </TabsContent>
        </Tabs>
      </div>
      
      <ExternalAdFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ad={selectedAd}
      />
    </AdminLayout>
  );
}