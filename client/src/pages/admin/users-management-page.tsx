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
  User as UserIcon, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Pencil, 
  Trash2,
  EyeOff,
  Ban
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDate, formatCurrency } from "@/lib/utils";

// Types for our users
interface User {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'user' | 'admin';
  balance: number;
  isActive: boolean;
  createdAt: string;
}

// Schema for editing users
const editUserSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  role: z.enum(['user', 'admin']),
  email: z.string().email("Email không hợp lệ")
});

export function UsersManagementPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [toggleActiveUser, setToggleActiveUser] = useState<User | null>(null);
  const { toast } = useToast();
  
  // Fetch users list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/users", page, limit],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users?page=${page}&limit=${limit}`);
      const data = await response.json();
      return data;
    }
  });

  // Edit user form
  const form = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: editingUser?.firstName || "",
      lastName: editingUser?.lastName || "",
      role: editingUser?.role || "user",
      email: editingUser?.email || ""
    }
  });

  // Reset form when editing user changes
  if (editingUser && form.getValues().email !== editingUser.email) {
    form.reset({
      firstName: editingUser.firstName,
      lastName: editingUser.lastName,
      role: editingUser.role,
      email: editingUser.email
    });
  }

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editUserSchema>) => {
      if (!editingUser) return null;
      const response = await apiRequest("PUT", `/api/users/${editingUser.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin người dùng đã được cập nhật"
      });
      setEditingUser(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Cập nhật thất bại",
        description: error instanceof Error ? error.message : "Không thể cập nhật người dùng",
        variant: "destructive"
      });
    }
  });

  // Toggle user active status mutation
  const toggleUserActiveMutation = useMutation({
    mutationFn: async () => {
      if (!toggleActiveUser) return null;
      const response = await apiRequest("PUT", `/api/users/${toggleActiveUser.id}/status`, {
        isActive: !toggleActiveUser.isActive
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: toggleActiveUser?.isActive ? "Khóa tài khoản thành công" : "Mở khóa tài khoản thành công",
        description: toggleActiveUser?.isActive 
          ? "Tài khoản người dùng đã bị khóa" 
          : "Tài khoản người dùng đã được mở khóa"
      });
      setToggleActiveUser(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Thao tác thất bại",
        description: error instanceof Error ? error.message : "Không thể thay đổi trạng thái người dùng",
        variant: "destructive"
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      if (!deleteUser) return null;
      const response = await apiRequest("DELETE", `/api/users/${deleteUser.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Xóa người dùng thành công",
        description: "Người dùng đã được xóa khỏi hệ thống"
      });
      setDeleteUser(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Xóa thất bại",
        description: error instanceof Error ? error.message : "Không thể xóa người dùng",
        variant: "destructive"
      });
    }
  });

  // Filter users based on search term
  const filteredUsers = data?.users.filter((user: User) => 
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Pagination logic
  const totalPages = Math.ceil((data?.total || 0) / limit);
  const handlePrevPage = () => setPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setPage(prev => Math.min(totalPages, prev + 1));

  // Handle form submission
  const onSubmit = (values: z.infer<typeof editUserSchema>) => {
    updateUserMutation.mutate(values);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
        </div>
        
        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin người dùng {editingUser?.username}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Email người dùng" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Tên" 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Họ" 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vai trò</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn vai trò" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">Người dùng</SelectItem>
                          <SelectItem value="admin">Quản trị viên</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Toggle User Active Status Dialog */}
        <Dialog open={!!toggleActiveUser} onOpenChange={(open) => !open && setToggleActiveUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{toggleActiveUser?.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}</DialogTitle>
              <DialogDescription>
                {toggleActiveUser?.isActive 
                  ? `Bạn có chắc chắn muốn khóa tài khoản của ${toggleActiveUser?.username}?`
                  : `Bạn có chắc chắn muốn mở khóa tài khoản của ${toggleActiveUser?.username}?`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setToggleActiveUser(null)}
              >
                Hủy
              </Button>
              <Button 
                variant={toggleActiveUser?.isActive ? "destructive" : "default"}
                onClick={() => toggleUserActiveMutation.mutate()}
                disabled={toggleUserActiveMutation.isPending}
              >
                {toggleUserActiveMutation.isPending ? "Đang xử lý..." : (toggleActiveUser?.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xóa người dùng</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa người dùng {deleteUser?.username}? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setDeleteUser(null)}
              >
                Hủy
              </Button>
              <Button 
                variant="destructive"
                onClick={() => deleteUserMutation.mutate()}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Đang xóa..." : "Xóa người dùng"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
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
                    filteredUsers.map((user: User) => (
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
                          <Badge variant={user.isActive ? 'success' : 'destructive'}>
                            {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setEditingUser(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setToggleActiveUser(user)}
                            >
                              {user.isActive ? (
                                <Ban className="h-4 w-4" />
                              ) : (
                                <UserIcon className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setDeleteUser(user)}
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