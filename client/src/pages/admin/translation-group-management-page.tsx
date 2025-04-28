import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Loader2, Search, Calendar } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { insertTranslationGroupSchema, type TranslationGroup } from '@shared/schema';
import { formatDate } from '@/lib/utils';
import AdminLayout from '@/components/layouts/admin-layout';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// Extend the insert schema with validation
const translationGroupFormSchema = insertTranslationGroupSchema.extend({
  name: z.string().min(2, 'Tên nhóm dịch phải có ít nhất 2 ký tự'),
  description: z.string().nullable().optional(),
  foundedDate: z.string().nullable().optional(),
});

export default function TranslationGroupManagementPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TranslationGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all translation groups
  const { data: translationGroups, isLoading } = useQuery<TranslationGroup[]>({
    queryKey: ['/api/translation-groups'],
  });

  // Create translation group form
  const createForm = useForm<z.infer<typeof translationGroupFormSchema>>({
    resolver: zodResolver(translationGroupFormSchema),
    defaultValues: {
      name: '',
      description: '',
      foundedDate: null,
    },
  });

  // Update translation group form
  const updateForm = useForm<z.infer<typeof translationGroupFormSchema>>({
    resolver: zodResolver(translationGroupFormSchema),
    defaultValues: {
      name: '',
      description: '',
      foundedDate: null,
    },
  });

  // Create translation group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (values: z.infer<typeof translationGroupFormSchema>) => {
      const res = await apiRequest('POST', '/api/translation-groups', values);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Nhóm dịch đã được tạo thành công',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/translation-groups'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: `Không thể tạo nhóm dịch: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update translation group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof translationGroupFormSchema> }) => {
      const res = await apiRequest('PUT', `/api/translation-groups/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Nhóm dịch đã được cập nhật thành công',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/translation-groups'] });
      setIsUpdateDialogOpen(false);
      setSelectedGroup(null);
      updateForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: `Không thể cập nhật nhóm dịch: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete translation group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/translation-groups/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Nhóm dịch đã được xóa thành công',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/translation-groups'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: `Không thể xóa nhóm dịch: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handle form submissions
  const onCreateSubmit = (values: z.infer<typeof translationGroupFormSchema>) => {
    createGroupMutation.mutate(values);
  };

  const onUpdateSubmit = (values: z.infer<typeof translationGroupFormSchema>) => {
    if (selectedGroup) {
      updateGroupMutation.mutate({ id: selectedGroup.id, data: values });
    }
  };

  // Handle edit button click
  const handleEditGroup = (group: TranslationGroup) => {
    setSelectedGroup(group);
    updateForm.reset({
      name: group.name,
      description: group.description,
      foundedDate: group.foundedDate,
    });
    setIsUpdateDialogOpen(true);
  };

  // Filter translation groups based on search query
  const filteredGroups = translationGroups?.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Quản lý nhóm dịch</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Thêm nhóm dịch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm nhóm dịch mới</DialogTitle>
                <DialogDescription>
                  Điền thông tin chi tiết để thêm nhóm dịch mới.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên nhóm dịch</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên nhóm dịch" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="foundedDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Ngày thành lập</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                              >
                                {field.value ? (
                                  format(new Date(field.value), 'PPP', { locale: vi })
                                ) : (
                                  <span>Chọn ngày</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Nhập mô tả nhóm dịch" 
                            {...field} 
                            value={field.value || ''}
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createGroupMutation.isPending}
                    >
                      {createGroupMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Tạo nhóm dịch
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
          <Input
            placeholder="Tìm kiếm nhóm dịch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="secondary" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách nhóm dịch</CardTitle>
            <CardDescription>
              Quản lý thông tin các nhóm dịch trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Tên nhóm dịch</TableHead>
                    <TableHead>Ngày thành lập</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups && filteredGroups.length > 0 ? (
                    filteredGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.id}</TableCell>
                        <TableCell>{group.name}</TableCell>
                        <TableCell>{formatDate(group.foundedDate)}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{group.description}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditGroup(group)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc chắn muốn xóa nhóm dịch "{group.name}"? Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteGroupMutation.mutate(group.id)}
                                  disabled={deleteGroupMutation.isPending}
                                >
                                  {deleteGroupMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        {searchQuery ? 'Không tìm thấy nhóm dịch nào phù hợp' : 'Chưa có nhóm dịch nào'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Update Translation Group Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cập nhật nhóm dịch</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin nhóm dịch.
              </DialogDescription>
            </DialogHeader>
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                <FormField
                  control={updateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên nhóm dịch</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên nhóm dịch" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="foundedDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Ngày thành lập</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                            >
                              {field.value ? (
                                format(new Date(field.value), 'PPP', { locale: vi })
                              ) : (
                                <span>Chọn ngày</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nhập mô tả nhóm dịch" 
                          {...field} 
                          value={field.value || ''} 
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={updateGroupMutation.isPending}
                  >
                    {updateGroupMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Cập nhật
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}