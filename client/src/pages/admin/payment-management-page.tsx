import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  
  // Fetch payments
  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/payments", page, limit, statusFilter],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // For now, we'll return mock data
      const allPayments = [
        { 
          id: 1, 
          userId: 1, 
          username: "user123", 
          amount: 100000, 
          method: "bank_transfer", 
          status: "completed", 
          transactionId: "PAY123456789",
          createdAt: "2023-07-10T08:45:12Z",
          updatedAt: "2023-07-10T09:15:36Z"
        },
        { 
          id: 2, 
          userId: 3, 
          username: "reader456", 
          amount: 50000, 
          method: "bank_transfer", 
          status: "pending", 
          transactionId: "PAY987654321",
          createdAt: "2023-07-12T10:22:45Z",
          updatedAt: "2023-07-12T10:22:45Z"
        },
        { 
          id: 3, 
          userId: 4, 
          username: "mangalover", 
          amount: 200000, 
          method: "credit_card", 
          status: "completed", 
          transactionId: "PAY246813579",
          createdAt: "2023-07-05T16:30:18Z",
          updatedAt: "2023-07-05T16:45:20Z"
        },
        { 
          id: 4, 
          userId: 2, 
          username: "admin", 
          amount: 500000, 
          method: "bank_transfer", 
          status: "completed", 
          transactionId: "PAY135792468",
          createdAt: "2023-07-01T12:15:42Z",
          updatedAt: "2023-07-01T12:35:15Z"
        },
        { 
          id: 5, 
          userId: 5, 
          username: "novelfan", 
          amount: 20000, 
          method: "e_wallet", 
          status: "failed", 
          transactionId: "PAY975318642",
          createdAt: "2023-07-15T09:18:24Z",
          updatedAt: "2023-07-15T09:25:32Z"
        }
      ];
      
      // Filter by status
      const filteredByStatus = statusFilter === "all" 
        ? allPayments 
        : allPayments.filter(payment => payment.status === statusFilter);
      
      return {
        payments: filteredByStatus,
        total: filteredByStatus.length
      };
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
      // In a real implementation, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
    }
  });

  // Reject payment mutation
  const rejectMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      // In a real implementation, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
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