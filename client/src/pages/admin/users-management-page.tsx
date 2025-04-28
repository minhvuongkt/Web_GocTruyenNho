import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Pencil, 
  Trash2,
  EyeOff,
  Ban
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

export function UsersManagementPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Fetch users list
  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/users", page, limit, search],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // For now, we'll return mock data
      return {
        users: [
          { 
            id: 1, 
            username: "user123", 
            email: "user123@example.com", 
            firstName: "Nguyễn", 
            lastName: "Văn A", 
            role: "user", 
            balance: 500000, 
            status: "active", 
            createdAt: "2023-05-10T08:45:12Z" 
          },
          { 
            id: 2, 
            username: "admin", 
            email: "admin@example.com", 
            firstName: "Trần", 
            lastName: "Thị B", 
            role: "admin", 
            balance: 1000000, 
            status: "active", 
            createdAt: "2023-04-15T10:22:36Z" 
          },
          { 
            id: 3, 
            username: "reader456", 
            email: "reader456@example.com", 
            firstName: "Lê", 
            lastName: "Văn C", 
            role: "user", 
            balance: 250000, 
            status: "active", 
            createdAt: "2023-06-20T16:30:18Z" 
          },
          { 
            id: 4, 
            username: "mangalover", 
            email: "mangalover@example.com", 
            firstName: "Phạm", 
            lastName: "Thị D", 
            role: "user", 
            balance: 750000, 
            status: "active", 
            createdAt: "2023-05-25T12:15:42Z" 
          },
          { 
            id: 5, 
            username: "novelfan", 
            email: "novelfan@example.com", 
            firstName: "Hoàng", 
            lastName: "Văn E", 
            role: "user", 
            balance: 100000, 
            status: "inactive", 
            createdAt: "2023-06-10T09:18:24Z" 
          }
        ],
        total: 5
      };
    }
  });

  // Filter users based on search term
  const filteredUsers = data?.users.filter(user => 
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Pagination logic
  const totalPages = Math.ceil((data?.total || 0) / limit);
  const handlePrevPage = () => setPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setPage(prev => Math.min(totalPages, prev + 1));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Danh sách người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, email, username..."
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
                    <TableHead>Tên người dùng</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead className="text-right">Số dư</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-right">Ngày tạo</TableHead>
                    <TableHead className="text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Đang tải dữ liệu...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Không tìm thấy dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'secondary' : 'outline'}>
                            {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(user.balance)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={user.status === 'active' ? 'success' : 'destructive'}>
                            {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-2">
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {user.status === 'active' ? (
                              <Button variant="ghost" size="icon">
                                <Ban className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon">
                                <User className="h-4 w-4" />
                              </Button>
                            )}
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

export default UsersManagementPage;