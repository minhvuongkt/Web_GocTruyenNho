import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/layouts/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AreaChart,
  BarChart,
  LineChart,
} from "@/components/ui/chart";
import {
  Users,
  BookOpen,
  CreditCard,
  TrendingUp,
  Eye,
  Clock,
  LayoutDashboard,
  BarChart3,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch overview stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["/api/admin/stats/overview"],
    queryFn: async () => {
      // In a real app, this would be an actual API call
      // For this demo, we'll return mock data
      return {
        totalUsers: 1254,
        totalContent: 348,
        totalPayments: 876,
        revenue: 48750000,
        views: 124598,
        recentPayments: 12,
        pendingPayments: 3,
        contentBreakdown: {
          manga: 230,
          novel: 118
        },
        popularGenres: [
          { name: "Hành động", count: 45 },
          { name: "Phiêu lưu", count: 38 },
          { name: "Tình cảm", count: 32 },
          { name: "Viễn tưởng", count: 28 },
          { name: "Kinh dị", count: 20 }
        ],
        viewsData: [
          { name: "Thg 1", manga: 4000, novel: 2400 },
          { name: "Thg 2", manga: 3000, novel: 1398 },
          { name: "Thg 3", manga: 2000, novel: 9800 },
          { name: "Thg 4", manga: 2780, novel: 3908 },
          { name: "Thg 5", manga: 1890, novel: 4800 },
          { name: "Thg 6", manga: 2390, novel: 3800 },
          { name: "Thg 7", manga: 3490, novel: 4300 },
        ],
        revenueData: [
          { name: "Thg 1", amount: 4000000 },
          { name: "Thg 2", amount: 3000000 },
          { name: "Thg 3", amount: 5000000 },
          { name: "Thg 4", amount: 8000000 },
          { name: "Thg 5", amount: 6000000 },
          { name: "Thg 6", amount: 9000000 },
          { name: "Thg 7", amount: 7200000 },
        ],
        dailyUsers: [
          { name: "CN", users: 20 },
          { name: "T2", users: 45 },
          { name: "T3", users: 35 },
          { name: "T4", users: 50 },
          { name: "T5", users: 30 },
          { name: "T6", users: 42 },
          { name: "T7", users: 55 },
        ]
      };
    }
  });
  
  // Fetch recent content
  const { data: recentContent, isLoading: loadingContent } = useQuery({
    queryKey: ["/api/admin/stats/recent-content"],
    queryFn: async () => {
      // In a real app, this would be an actual API call
      // For this demo, we'll return mock data
      return [
        { 
          id: 1, 
          title: "Thám Tử Lừng Danh", 
          type: "manga", 
          views: 1254, 
          chapters: 87, 
          status: "ongoing", 
          updatedAt: "2023-07-15T08:45:12Z" 
        },
        { 
          id: 2, 
          title: "Hoa Anh Đào", 
          type: "manga", 
          views: 876, 
          chapters: 24, 
          status: "ongoing", 
          updatedAt: "2023-07-14T14:22:45Z" 
        },
        { 
          id: 3, 
          title: "Vũ Trụ Song Song", 
          type: "novel", 
          views: 543, 
          chapters: 15, 
          status: "ongoing", 
          updatedAt: "2023-07-13T10:15:32Z" 
        },
        { 
          id: 4, 
          title: "Kiếm Sĩ Bóng Đêm", 
          type: "manga", 
          views: 1122, 
          chapters: 56, 
          status: "completed", 
          updatedAt: "2023-07-12T16:30:20Z" 
        },
        { 
          id: 5, 
          title: "Bí Mật Của Naoko", 
          type: "novel", 
          views: 432, 
          chapters: 8, 
          status: "ongoing", 
          updatedAt: "2023-07-11T09:12:18Z" 
        }
      ];
    }
  });
  
  // If user is not admin, show access denied
  if (user?.role !== 'admin') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Không có quyền truy cập</h1>
            <p className="text-muted-foreground mb-4">Bạn không có quyền truy cập vào trang quản trị.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Filter data for this week
                alert('Đang lọc dữ liệu trong tuần này');
                // In a real app, you would dispatch a query with date filters
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Tuần này
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Generate and download report
                alert('Đang tạo báo cáo...');
                // In a real app, you would generate and trigger download of a report
              }}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Báo cáo
            </Button>
          </div>
        </div>
        
        {/* Stats overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng người dùng
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalUsers.toLocaleString() || "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% so với tháng trước
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Truyện đã đăng
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalContent.toLocaleString() || "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats ? `${stats.contentBreakdown.manga} manga, ${stats.contentBreakdown.novel} novel` : "-"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Doanh thu
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats ? formatCurrency(stats.revenue) : "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                +24% so với tháng trước
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Lượt xem
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.views.toLocaleString() || "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                +18% so với tháng trước
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="views" className="flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              Lượt xem
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Doanh thu
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Lượt xem theo tháng</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <AreaChart 
                    data={stats?.viewsData || []}
                    index="name"
                    categories={["manga", "novel"]}
                    colors={["#FF6B6B", "#4ECDC4"]}
                    valueFormatter={(value: number) => `${value.toLocaleString()} lượt`}
                    showLegend
                    showXAxis
                    showYAxis
                    showGridLines
                    height="h-[300px]"
                  />
                </CardContent>
              </Card>
              
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Đăng ký người dùng trong tuần</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <BarChart 
                    data={stats?.dailyUsers || []}
                    index="name"
                    categories={["users"]}
                    colors={["#FF6B6B"]}
                    valueFormatter={(value: number) => `${value} người dùng`}
                    showXAxis
                    showYAxis
                    height="h-[300px]"
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Thể loại phổ biến</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.popularGenres.map((genre, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-32 flex-shrink-0">
                          <div className="text-sm font-medium">{genre.name}</div>
                        </div>
                        <div className="flex-1 flex items-center">
                          <div 
                            className="h-2 bg-primary rounded-full" 
                            style={{ width: `${(genre.count / stats.popularGenres[0].count) * 100}%` }}
                          />
                          <span className="ml-2 text-sm text-muted-foreground">{genre.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Doanh thu theo tháng</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <LineChart 
                    data={stats?.revenueData || []}
                    index="name"
                    categories={["amount"]}
                    colors={["#4ECDC4"]}
                    valueFormatter={(value: number) => formatCurrency(value)}
                    showXAxis
                    showYAxis
                    showGridLines
                    height="h-[300px]"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="views" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lượt xem chi tiết</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <AreaChart 
                    data={stats?.viewsData || []}
                    index="name"
                    categories={["manga", "novel"]}
                    colors={["#FF6B6B", "#4ECDC4"]}
                    valueFormatter={(value: number) => `${value.toLocaleString()} lượt`}
                    showLegend
                    showXAxis
                    showYAxis
                    showGridLines
                    startEndOnly={false}
                    height="h-[400px]"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Phân tích doanh thu</CardTitle>
                <CardDescription>
                  Doanh thu từ việc mở khóa chương theo tháng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <LineChart 
                    data={stats?.revenueData || []}
                    index="name"
                    categories={["amount"]}
                    colors={["#4ECDC4"]}
                    valueFormatter={(value: number) => formatCurrency(value)}
                    showXAxis
                    showYAxis
                    showGridLines
                    startEndOnly={false}
                    height="h-[400px]"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Recent activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Giao dịch gần đây</CardTitle>
              <CardDescription>
                {stats ? `${stats.recentPayments} giao dịch trong 24h qua` : "Đang tải..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Nạp tiền thành công</p>
                      <p className="text-xs text-muted-foreground">user123 - 200,000 VNĐ</p>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      2 phút trước
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Nạp tiền thành công</p>
                      <p className="text-xs text-muted-foreground">user456 - 500,000 VNĐ</p>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      15 phút trước
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center">
                    <div className="w-9 h-9 rounded-full bg-yellow-500/10 flex items-center justify-center mr-3">
                      <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Giao dịch đang xử lý</p>
                      <p className="text-xs text-muted-foreground">user789 - 100,000 VNĐ</p>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      45 phút trước
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/admin/payments">Xem tất cả giao dịch</a>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Truyện mới cập nhật</CardTitle>
              <CardDescription>
                Truyện được cập nhật gần đây
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentContent ? (
                <div className="space-y-4">
                  {recentContent.map((content, index) => (
                    <div key={content.id}>
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center mr-3">
                          <BookOpen className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{content.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {content.type === 'manga' ? 'Truyện tranh' : 'Truyện chữ'} - {content.chapters} chương
                          </p>
                        </div>
                        <div className="ml-auto text-xs text-muted-foreground">
                          {new Date(content.updatedAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      {index < recentContent.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/admin/manga">Quản lý truyện</a>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

export default DashboardPage;
