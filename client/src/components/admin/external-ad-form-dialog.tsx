import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Globe, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define external ad interface
interface ExternalAd {
  id: number;
  name: string;
  provider: string;
  position: string;
  scriptContent: string;
  containerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  height?: number;
  width?: number;
  displayOrder?: number;
  startDate?: string;
  endDate?: string;
  isMobileEnabled: boolean;
}

// Props for the component
interface ExternalAdFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ad: ExternalAd | null;
}

// Schema for form validation
const externalAdSchema = z.object({
  name: z.string().min(1, "Tên quảng cáo không được để trống"),
  provider: z.enum(["google", "facebook", "other"]),
  position: z.enum(["top", "bottom", "left", "right", "popup", "overlay", "custom"]),
  scriptContent: z.string().min(1, "Nội dung script không được để trống"),
  containerId: z.string().optional(),
  isActive: z.boolean().default(true),
  height: z.coerce.number().int().optional(),
  width: z.coerce.number().int().optional(),
  displayOrder: z.coerce.number().int().optional(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  isMobileEnabled: z.boolean().default(true),
});

type FormValues = z.infer<typeof externalAdSchema>;

export function ExternalAdFormDialog({ open, onOpenChange, ad }: ExternalAdFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!ad;

  // Setup form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(externalAdSchema),
    defaultValues: {
      name: "",
      provider: "google",
      position: "top",
      scriptContent: "",
      containerId: "",
      isActive: true,
      height: undefined,
      width: undefined,
      displayOrder: undefined,
      startDate: null,
      endDate: null,
      isMobileEnabled: true,
    },
  });

  // Update form when editing an existing ad
  useEffect(() => {
    if (ad) {
      form.reset({
        name: ad.name,
        provider: ad.provider as any,
        position: ad.position as any,
        scriptContent: ad.scriptContent,
        containerId: ad.containerId || "",
        isActive: ad.isActive,
        height: ad.height,
        width: ad.width,
        displayOrder: ad.displayOrder,
        startDate: ad.startDate ? new Date(ad.startDate) : null,
        endDate: ad.endDate ? new Date(ad.endDate) : null,
        isMobileEnabled: ad.isMobileEnabled,
      });
    } else {
      form.reset({
        name: "",
        provider: "google",
        position: "top",
        scriptContent: "",
        containerId: "",
        isActive: true,
        height: undefined,
        width: undefined,
        displayOrder: undefined,
        startDate: null,
        endDate: null,
        isMobileEnabled: true,
      });
    }
  }, [ad, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: FormValues) => {
      return apiRequest.post('/api/external-ads', data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã thêm quảng cáo mới thành công",
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['/api/external-ads'] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể thêm quảng cáo. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: FormValues & { id: number }) => {
      return apiRequest.patch(`/api/external-ads/${data.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật quảng cáo thành công",
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['/api/external-ads'] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật quảng cáo. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    
    // Format dates for API
    const formattedValues = {
      ...values,
      startDate: values.startDate ? values.startDate : undefined,
      endDate: values.endDate ? values.endDate : undefined,
    };
    
    if (isEditing && ad) {
      updateMutation.mutate({ ...formattedValues, id: ad.id });
    } else {
      createMutation.mutate(formattedValues);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Sửa quảng cáo" : "Thêm quảng cáo mới"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin quảng cáo từ bên thứ 3"
              : "Thêm quảng cáo mới từ các nhà cung cấp như Google AdSense, Facebook Ads"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
                <TabsTrigger value="advanced">Thông tin nâng cao</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên quảng cáo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên quảng cáo" {...field} />
                      </FormControl>
                      <FormDescription>
                        Tên để dễ nhận biết quảng cáo này trong hệ thống
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nhà cung cấp</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn nhà cung cấp" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="google">Google AdSense</SelectItem>
                            <SelectItem value="facebook">Facebook Ads</SelectItem>
                            <SelectItem value="other">Khác</SelectItem>
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn vị trí" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="top">Đầu trang</SelectItem>
                            <SelectItem value="bottom">Cuối trang</SelectItem>
                            <SelectItem value="left">Bên trái</SelectItem>
                            <SelectItem value="right">Bên phải</SelectItem>
                            <SelectItem value="popup">Popup</SelectItem>
                            <SelectItem value="overlay">Lớp phủ</SelectItem>
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
                      <FormLabel>Nội dung script</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Dán mã script từ nhà cung cấp quảng cáo vào đây"
                          {...field}
                          rows={6}
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        Script HTML/JavaScript được cung cấp bởi dịch vụ quảng cáo
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
                      <FormLabel>Container ID (tùy chọn)</FormLabel>
                      <FormControl>
                        <Input placeholder="ad-container-123" {...field} />
                      </FormControl>
                      <FormDescription>
                        ID của container chứa quảng cáo (nếu script yêu cầu)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Kích hoạt quảng cáo</FormLabel>
                        <FormDescription>
                          Quảng cáo sẽ chỉ hiển thị khi được kích hoạt
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
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4 pt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Thông tin bổ sung</AlertTitle>
                  <AlertDescription>
                    Các thông tin nâng cao giúp kiểm soát chính xác hơn cách hiển thị quảng cáo
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chiều rộng (px)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Chiều rộng"
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chiều cao (px)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Chiều cao"
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thứ tự hiển thị</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Thứ tự hiển thị"
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Số nhỏ hơn sẽ hiển thị trước
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Ngày bắt đầu (tùy chọn)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Không giới hạn</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Ngày quảng cáo bắt đầu hiển thị
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Ngày kết thúc (tùy chọn)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Không giới hạn</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                                (form.getValues("startDate") && date < form.getValues("startDate"))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Ngày quảng cáo ngừng hiển thị
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="isMobileEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Hiển thị trên thiết bị di động</FormLabel>
                        <FormDescription>
                          Quảng cáo sẽ hiển thị cả trên thiết bị di động
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
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Đang lưu...
                  </>
                ) : isEditing ? (
                  "Cập nhật"
                ) : (
                  "Thêm quảng cáo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}