import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ExternalAdConfig } from '@/components/ads/external-ad';

// Validation schema for the form
const externalAdSchema = z.object({
  name: z.string().min(1, 'Tên là bắt buộc'),
  provider: z.string().min(1, 'Nhà cung cấp là bắt buộc'),
  position: z.string().min(1, 'Vị trí là bắt buộc'),
  scriptContent: z.string().min(1, 'Mã script là bắt buộc'),
  containerId: z.string().optional(),
  isActive: z.boolean().default(true),
  width: z.union([z.number().positive(), z.nan(), z.null()]).optional().transform(val => isNaN(val) ? null : val),
  height: z.union([z.number().positive(), z.nan(), z.null()]).optional().transform(val => isNaN(val) ? null : val),
  displayOrder: z.union([z.number().nonnegative(), z.nan()]).default(0).transform(val => isNaN(val) ? 0 : val),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  isMobileEnabled: z.boolean().default(true),
});

// Create a type for the form values using the schema
type FormValues = z.infer<typeof externalAdSchema>;

// Props interface for the component
interface ExternalAdFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ad: ExternalAdConfig | null;
}

// The external ad form dialog component
export function ExternalAdFormDialog({ open, onOpenChange, ad }: ExternalAdFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  // Initialize form with existing ad data or default values
  const form = useForm<FormValues>({
    resolver: zodResolver(externalAdSchema),
    defaultValues: ad ? {
      name: ad.name,
      provider: ad.provider,
      position: ad.position,
      scriptContent: ad.scriptContent,
      containerId: ad.containerId || '',
      isActive: ad.isActive,
      width: ad.width || null,
      height: ad.height || null,
      displayOrder: ad.displayOrder || 0,
      startDate: ad.startDate ? new Date(ad.startDate) : null,
      endDate: ad.endDate ? new Date(ad.endDate) : null,
      isMobileEnabled: ad.isMobileEnabled
    } : {
      name: '',
      provider: 'google',
      position: 'bottom',
      scriptContent: '',
      containerId: '',
      isActive: true,
      width: null,
      height: null,
      displayOrder: 0,
      startDate: null,
      endDate: null,
      isMobileEnabled: true
    }
  });

  // Mutation to create a new external ad
  const createMutation = useMutation({
    mutationFn: (data: FormValues) => {
      return apiRequest('POST', '/api/external-ads', data);
    },
    onSuccess: () => {
      toast({
        title: 'Tạo thành công',
        description: 'Đã thêm cấu hình quảng cáo mới vào hệ thống.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/external-ads'] });
      onOpenChange(false); // Close dialog
      form.reset(); // Reset form
    },
    onError: (error) => {
      toast({
        title: 'Lỗi khi tạo',
        description: `Đã xảy ra lỗi: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsPending(false);
    }
  });

  // Mutation to update an existing external ad
  const updateMutation = useMutation({
    mutationFn: (data: FormValues & { id: number }) => {
      const { id, ...updateData } = data;
      return apiRequest('PATCH', `/api/external-ads/${id}`, updateData);
    },
    onSuccess: () => {
      toast({
        title: 'Cập nhật thành công',
        description: 'Đã cập nhật cấu hình quảng cáo.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/external-ads'] });
      onOpenChange(false); // Close dialog
    },
    onError: (error) => {
      toast({
        title: 'Lỗi khi cập nhật',
        description: `Đã xảy ra lỗi: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsPending(false);
    }
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    setIsPending(true);
    if (ad) {
      updateMutation.mutate({ ...values, id: ad.id });
    } else {
      createMutation.mutate(values);
    }
  };

  // Template examples for quick insertion
  const scriptTemplates = {
    google: `<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="XXXXXXXXXX"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`,
    facebook: `<div id="fb-root"></div>
<script async defer crossorigin="anonymous" 
  src="https://connect.facebook.net/vi_VN/sdk.js#xfbml=1&version=v18.0" 
  nonce="XXXXXXXXXX">
</script>
<div class="fb-page" 
  data-href="https://www.facebook.com/facebook" 
  data-tabs="timeline" 
  data-width="" 
  data-height="" 
  data-small-header="false" 
  data-adapt-container-width="true" 
  data-hide-cover="false" 
  data-show-facepile="true">
</div>`,
    tiktok: `<script>
  (function() {
    var ta = document.createElement('script'); 
    ta.type = 'text/javascript'; 
    ta.async = true;
    ta.src = 'https://sf16-scmcdn-va.ibytedtos.com/goofy/tiktok-business-en/tiktok-business-sdk.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ta, s);
  })();
</script>`,
    custom: `<!-- Chèn mã script quảng cáo tùy chỉnh vào đây -->
<div id="custom-ad-container">
  <!-- Nội dung quảng cáo -->
</div>
<script>
  // JavaScript code cho quảng cáo
  console.log('Custom ad loaded');
</script>`
  };

  // Function to insert a template based on selected provider
  const insertTemplate = (provider: string) => {
    const template = scriptTemplates[provider as keyof typeof scriptTemplates] || scriptTemplates.custom;
    form.setValue('scriptContent', template);
    
    // Auto-generate container ID if empty
    if (!form.getValues('containerId')) {
      form.setValue('containerId', `${provider}-ad-container`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {ad ? 'Sửa cấu hình quảng cáo' : 'Thêm cấu hình quảng cáo mới'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên quảng cáo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên quảng cáo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhà cung cấp</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // When provider changes, offer to insert a template
                        if (window.confirm('Bạn có muốn chèn mẫu script cho nhà cung cấp này không?')) {
                          insertTemplate(value);
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn nhà cung cấp" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="google">Google AdSense</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="coccoc">Cốc Cốc</SelectItem>
                        <SelectItem value="adtima">Adtima</SelectItem>
                        <SelectItem value="custom">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vị trí hiển thị</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn vị trí" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="top">Trên đầu</SelectItem>
                        <SelectItem value="bottom">Dưới chân</SelectItem>
                        <SelectItem value="left">Bên trái</SelectItem>
                        <SelectItem value="right">Bên phải</SelectItem>
                        <SelectItem value="popup">Popup</SelectItem>
                        <SelectItem value="overlay">Overlay</SelectItem>
                        <SelectItem value="custom">Tùy chỉnh</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="scriptContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã quảng cáo (Script)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập mã script quảng cáo từ nhà cung cấp"
                      {...field}
                      className="font-mono text-sm min-h-[200px]"
                    />
                  </FormControl>
                  <FormDescription>
                    Mã HTML/JavaScript từ nhà cung cấp dịch vụ quảng cáo.
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => insertTemplate(form.getValues('provider'))}
                    >
                      Chèn mẫu
                    </Button>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="containerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Container (không bắt buộc)</FormLabel>
                  <FormControl>
                    <Input placeholder="ID của container chứa quảng cáo" {...field} />
                  </FormControl>
                  <FormDescription>
                    ID của container sẽ được sử dụng để chèn quảng cáo vào.
                    Nếu để trống, một ID sẽ được tạo tự động.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chiều rộng</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Chiều rộng (px)"
                        {...field}
                        value={field.value === null ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Để trống để tự động</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chiều cao</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Chiều cao (px)"
                        {...field}
                        value={field.value === null ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Để trống để tự động</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thứ tự hiển thị</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Thứ tự"
                        {...field}
                        value={field.value === null ? 0 : field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Số nhỏ hiển thị trước</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày bắt đầu</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              "Chọn ngày bắt đầu"
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(date) => field.onChange(date)}
                          disabled={(date) => {
                            const endDate = form.getValues("endDate");
                            return endDate ? date > endDate : false;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={() => field.onChange(null)}
                      className="self-start mt-1"
                    >
                      Xóa ngày
                    </Button>
                    <FormDescription>Để trống cho quảng cáo không có thời hạn bắt đầu</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày kết thúc</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              "Chọn ngày kết thúc"
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={(date) => field.onChange(date)}
                          disabled={(date) => {
                            const startDate = form.getValues("startDate");
                            return startDate ? date < startDate : false;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={() => field.onChange(null)}
                      className="self-start mt-1"
                    >
                      Xóa ngày
                    </Button>
                    <FormDescription>Để trống cho quảng cáo không có thời hạn kết thúc</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Kích hoạt</FormLabel>
                      <FormDescription>
                        Bật/tắt hiển thị quảng cáo trên trang web
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isMobileEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Hiển thị trên di động</FormLabel>
                      <FormDescription>
                        Hiển thị quảng cáo trên thiết bị di động
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang xử lý..." : ad ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}