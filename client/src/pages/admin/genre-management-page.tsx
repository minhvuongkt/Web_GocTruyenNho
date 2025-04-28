import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { insertGenreSchema, type Genre } from '@shared/schema';

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

// Extend the insert schema with validation
const genreFormSchema = insertGenreSchema.extend({
  name: z.string().min(2, 'Tên thể loại phải có ít nhất 2 ký tự'),
  description: z.string().nullable().optional(),
});

export default function GenreManagementPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all genres
  const { data: genres, isLoading } = useQuery<Genre[]>({
    queryKey: ['/api/genres'],
  });

  // Create genre form
  const createForm = useForm<z.infer<typeof genreFormSchema>>({
    resolver: zodResolver(genreFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Update genre form
  const updateForm = useForm<z.infer<typeof genreFormSchema>>({
    resolver: zodResolver(genreFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Create genre mutation
  const createGenreMutation = useMutation({
    mutationFn: async (values: z.infer<typeof genreFormSchema>) => {
      const res = await apiRequest('POST', '/api/genres', values);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Thể loại đã được tạo thành công',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/genres'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: `Không thể tạo thể loại: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update genre mutation
  const updateGenreMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof genreFormSchema> }) => {
      const res = await apiRequest('PUT', `/api/genres/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Thể loại đã được cập nhật thành công',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/genres'] });
      setIsUpdateDialogOpen(false);
      setSelectedGenre(null);
      updateForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: `Không thể cập nhật thể loại: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete genre mutation
  const deleteGenreMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/genres/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Thể loại đã được xóa thành công',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/genres'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: `Không thể xóa thể loại: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handle form submissions
  const onCreateSubmit = (values: z.infer<typeof genreFormSchema>) => {
    createGenreMutation.mutate(values);
  };

  const onUpdateSubmit = (values: z.infer<typeof genreFormSchema>) => {
    if (selectedGenre) {
      updateGenreMutation.mutate({ id: selectedGenre.id, data: values });
    }
  };

  // Handle edit button click
  const handleEditGenre = (genre: Genre) => {
    setSelectedGenre(genre);
    updateForm.reset({
      name: genre.name,
      description: genre.description,
    });
    setIsUpdateDialogOpen(true);
  };

  // Filter genres based on search query
  const filteredGenres = genres?.filter(genre => 
    genre.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (genre.description && genre.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý thể loại</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Thêm thể loại
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm thể loại mới</DialogTitle>
              <DialogDescription>
                Điền thông tin chi tiết để thêm thể loại mới.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên thể loại</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên thể loại" {...field} />
                      </FormControl>
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
                          placeholder="Nhập mô tả thể loại" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createGenreMutation.isPending}
                  >
                    {createGenreMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Tạo thể loại
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
        <Input
          placeholder="Tìm kiếm thể loại..."
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
          <CardTitle>Danh sách thể loại</CardTitle>
          <CardDescription>
            Quản lý các thể loại truyện trong hệ thống
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
                  <TableHead>Tên thể loại</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGenres && filteredGenres.length > 0 ? (
                  filteredGenres.map((genre) => (
                    <TableRow key={genre.id}>
                      <TableCell className="font-medium">{genre.id}</TableCell>
                      <TableCell>{genre.name}</TableCell>
                      <TableCell>{genre.description}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditGenre(genre)}
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
                                Bạn có chắc chắn muốn xóa thể loại "{genre.name}"? Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteGenreMutation.mutate(genre.id)}
                                disabled={deleteGenreMutation.isPending}
                              >
                                {deleteGenreMutation.isPending && (
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
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      {searchQuery ? 'Không tìm thấy thể loại nào phù hợp' : 'Chưa có thể loại nào'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Update Genre Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật thể loại</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin thể loại.
            </DialogDescription>
          </DialogHeader>
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên thể loại</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên thể loại" {...field} />
                    </FormControl>
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
                        placeholder="Nhập mô tả thể loại" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateGenreMutation.isPending}
                >
                  {updateGenreMutation.isPending && (
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