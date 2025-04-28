import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X,
  Calendar,
  Download
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatCurrency } from "@/lib/utils";

export function PaymentManagementPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  
  // Define the type for payments
  interface Payment {
    id: number;
    userId: number;
    username: string;
    amount: number;
    method: string;
    status: string;
    transactionId: string;
    createdAt: string;
  }

  // Fetch payments
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/payments", page, limit, statusFilter],
    queryFn: async () => {
      // Build the query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        all: 'true' // Admin view, get all payments
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      try {
        const response = await apiRequest("GET", `/api/payments?${params.toString()}`);
        const data = await response.json();
        
        // Add username to each payment by fetching user info
        const paymentsWithUsername = await Promise.all(
          data.payments.map(async (payment: any) => {
            try {
              // In a full implementation, this would be a batch request
              // For now, we'll add a placeholder username based on userId
              return {
                ...payment,
                username: `user_${payment.userId}`
              };
            } catch (error) {
              return {
                ...payment,
                username: `Unknown User (ID: ${payment.userId})`
              };
            }
          })
        );
        
        return {
          payments: paymentsWithUsername,
          total: data.total
        };
      } catch (error) {
        console.error("Error fetching payments:", error);
        return { payments: [], total: 0 };
      }
    }
  });

  // Filter payments based on search term
  const filteredPayments = data?.payments.filter(payment => 
    payment.username.toLowerCase().includes(search.toLowerCase()) ||
    payment.transactionId.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Pagination logic
  const totalPages = Math.ceil((filteredPayments.length || 0) / limit);
  const handlePrevPage = () => setPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setPage(prev => Math.min(totalPages, prev + 1));
  
  // Current page payments
  const currentPayments = filteredPayments.slice((page - 1) * limit, page * limit);

  // Approve payment mutation
  const approveMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const response = await apiRequest("PUT", `/api/payments/${paymentId}/status`, {
        status: 'completed'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Giao dịch đã được duyệt",
        description: "Số dư của người dùng đã được cập nhật"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
    onError: (error) => {
      toast({
        title: "Duyệt giao dịch thất bại",
        description: error instanceof Error ? error.message : "Không thể duyệt giao dịch",
        variant: "destructive"
      });
    }
  });

  // Reject payment mutation
  const rejectMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const response = await apiRequest("PUT", `/api/payments/${paymentId}/status`, {
        status: 'failed'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Giao dịch đã bị từ chối",
        description: "Trạng thái giao dịch đã được cập nhật thành 'Thất bại'"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
    onError: (error) => {
      toast({
        title: "Từ chối giao dịch thất bại",
        description: error instanceof Error ? error.message : "Không thể từ chối giao dịch",
        variant: "destructive"
      });
    }
  });

  // Get payment method label
  const getMethodLabel = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "Chuyển khoản ngân hàng";
      case "credit_card":
        return "Thẻ tín dụng";
      case "e_wallet":
        return "Ví điện tử";
      default:
        return method;
    }
  };

  // Get payment status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Đã hoàn thành</Badge>;
      case "pending":
        return <Badge variant="warning">Đang xử lý</Badge>;
      case "failed":
        return <Badge variant="destructive">Thất bại</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Quản lý thanh toán</h1>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử giao dịch</CardTitle>
            <CardDescription>
              Quản lý và xem các giao dịch thanh toán của người dùng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4 justify-between">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo username, mã GD..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Đang xử lý</SelectItem>
                    <SelectItem value="completed">Đã hoàn thành</SelectItem>
                    <SelectItem value="failed">Thất bại</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Theo ngày
                </Button>
              </div>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã giao dịch</TableHead>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Phương thức</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-right">Ngày tạo</TableHead>
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
                  ) : currentPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        Không tìm thấy dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.transactionId}</TableCell>
                        <TableCell>{payment.username}</TableCell>
                        <TableCell>{getMethodLabel(payment.method)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell className="text-right">{formatDate(payment.createdAt)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-2">
                            {payment.status === 'pending' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => approveMutation.mutate(payment.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Duyệt
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => rejectMutation.mutate(payment.id)}
                                  disabled={rejectMutation.isPending}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Từ chối
                                </Button>
                              </>
                            )}
                            {(payment.status === 'completed' || payment.status === 'failed') && (
                              <Button variant="outline" size="sm">
                                Xem chi tiết
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Trang trước</span>
                </Button>
                <div className="text-sm text-muted-foreground">
                  Trang {page} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Trang sau</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default PaymentManagementPage;