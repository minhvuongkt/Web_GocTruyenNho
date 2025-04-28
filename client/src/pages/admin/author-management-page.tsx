import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Loader2, Search, Calendar } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { insertAuthorSchema, type Author } from '@shared/schema';
import { formatDate } from '@/lib/utils';

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
const authorFormSchema = insertAuthorSchema.extend({
  name: z.string().min(2, 'Tên tác giả phải có ít nhất 2 ký tự'),
  info: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
});

export default function AuthorManagementPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all authors
  const { data: authors, isLoading } = useQuery<Author[]>({
    queryKey: ['/api/authors'],
  });

  // Create author form
  const createForm = useForm<z.infer<typeof authorFormSchema>>({
    resolver: zodResolver(authorFormSchema),
    defaultValues: {
      name: '',
      info: '',
      birthDate: null,
    },
  });

  // Update author form
  const updateForm = useForm<z.infer<typeof authorFormSchema>>({
    resolver: zodResolver(authorFormSchema),
    defaultValues: {
      name: '',
      info: '',
      birthDate: null,
    },
  });

  // Create author mutation
  const createAuthorMutation = useMutation({
    mutationFn: async (values: z.infer<typeof authorFormSchema>) => {
      const res = await apiRequest('POST', '/api/authors', values);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Tác giả đã được tạo thành công',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/authors'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: `Không thể tạo tác giả: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update author mutation
  const updateAuthorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof authorFormSchema> }) => {
      const res = await apiRequest('PUT', `/api/authors/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Tác giả đã được cập nhật thành công',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/authors'] });
      setIsUpdateDialogOpen(false);
      setSelectedAuthor(null);
      updateForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: `Không thể cập nhật tác giả: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete author mutation
  const deleteAuthorMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/authors/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Tác giả đã được xóa thành công',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/authors'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: `Không thể xóa tác giả: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handle form submissions
  const onCreateSubmit = (values: z.infer<typeof authorFormSchema>) => {
    createAuthorMutation.mutate(values);
  };

  const onUpdateSubmit = (values: z.infer<typeof authorFormSchema>) => {
    if (selectedAuthor) {
      updateAuthorMutation.mutate({ id: selectedAuthor.id, data: values });
    }
  };

  // Handle edit button click
  const handleEditAuthor = (author: Author) => {
    setSelectedAuthor(author);
    updateForm.reset({
      name: author.name,
      info: author.info,
      birthDate: author.birthDate,
    });
    setIsUpdateDialogOpen(true);
  };

  // Filter authors based on search query
  const filteredAuthors = authors?.filter(author => 
    author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (author.info && author.info.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý tác giả</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Thêm tác giả
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm tác giả mới</DialogTitle>
              <DialogDescription>
                Điền thông tin chi tiết để thêm tác giả mới.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên tác giả</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên tác giả" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Ngày sinh</FormLabel>
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
                  name="info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thông tin</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nhập thông tin tác giả" 
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
                    disabled={createAuthorMutation.isPending}
                  >
                    {createAuthorMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Tạo tác giả
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
        <Input
          placeholder="Tìm kiếm tác giả..."
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
          <CardTitle>Danh sách tác giả</CardTitle>
          <CardDescription>
            Quản lý thông tin các tác giả trong hệ thống
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
                  <TableHead>Tên tác giả</TableHead>
                  <TableHead>Ngày sinh</TableHead>
                  <TableHead>Thông tin</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuthors && filteredAuthors.length > 0 ? (
                  filteredAuthors.map((author) => (
                    <TableRow key={author.id}>
                      <TableCell className="font-medium">{author.id}</TableCell>
                      <TableCell>{author.name}</TableCell>
                      <TableCell>{formatDate(author.birthDate)}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{author.info}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditAuthor(author)}
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
                                Bạn có chắc chắn muốn xóa tác giả "{author.name}"? Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteAuthorMutation.mutate(author.id)}
                                disabled={deleteAuthorMutation.isPending}
                              >
                                {deleteAuthorMutation.isPending && (
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
                      {searchQuery ? 'Không tìm thấy tác giả nào phù hợp' : 'Chưa có tác giả nào'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Update Author Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật tác giả</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin tác giả.
            </DialogDescription>
          </DialogHeader>
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên tác giả</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên tác giả" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày sinh</FormLabel>
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
                name="info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thông tin</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Nhập thông tin tác giả" 
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
                  disabled={updateAuthorMutation.isPending}
                >
                  {updateAuthorMutation.isPending && (
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
  );
}